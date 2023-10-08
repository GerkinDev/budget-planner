import assert from 'assert';
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  readDirectoryAsync,
  writeAsStringAsync,
  deleteAsync,
} from 'expo-file-system';
import {basename, dirname} from 'path';
import {Operation, Profile} from '@budget-planner/models';
import {isNil, memoizeWith, omit} from 'ramda';
import {ReadonlyDeep, Jsonify} from 'type-fest';
import {sortUsing} from '~/helpers/functional';
import {roundDate} from '~/helpers/date';

type Preferences = {
  defaultProfileName?: string;
};
type Obj = Record<string, unknown>;

export interface IFileRW<TIn extends Obj = Obj, TOut extends Obj = TIn> {
  readonly file: string;
  read(): Promise<ReadonlyDeep<TOut> | false>;
  write(value: ReadonlyDeep<TIn>): Promise<void>;
  rm(): Promise<void>;
}
export namespace IFileRW {
  export type In<T extends IFileRW> = T extends IFileRW<infer U> ? U : never;
  export type Out<T extends IFileRW> = T extends IFileRW<Obj, infer U>
    ? U
    : never;
}

class FileRW<
  TIn extends Record<string, unknown>,
  TOut extends Jsonify<TIn> = Jsonify<TIn>,
> implements IFileRW<TIn, TOut>
{
  public static readonly for = memoizeWith(
    file => file,
    <
      _TIn extends Record<string, unknown>,
      _TOut extends Jsonify<_TIn> = Jsonify<_TIn>,
    >(
      file: string,
    ) => new this<_TIn, _TOut>(file),
  );

  private _cache: ReadonlyDeep<TOut> | null = null;

  private constructor(public readonly file: string) {}

  async read() {
    if (this._cache) {
      return this._cache;
    }
    try {
      const content = await readAsStringAsync(this.file);
      if (content) {
        this._cache = JSON.parse(content);
        return this._cache!;
      }
      return false;
    } catch (e: any) {
      if (
        e instanceof Error &&
        e.message.startsWith(
          "Call to function 'ExponentFileSystem.readAsStringAsync' has been rejected.\n→ Caused by: java.io.FileNotFoundException",
        )
      ) {
        return false;
      }
      return false;
    }
  }
  async write(value: ReadonlyDeep<TIn>) {
    assert(typeof value === 'object' && !isNil(value));
    console.log('WRITE', this.file, value);
    await makeDirectoryAsync(dirname(this.file), {intermediates: true});
    await writeAsStringAsync(this.file, JSON.stringify(value));
    this._cache = null;
  }
  async rm() {
    await deleteAsync(this.file, {idempotent: true});
    this._cache = null;
  }
}

class CompositeFileRW<Public extends Obj, BaseRW extends IFileRW>
  implements IFileRW<Public>
{
  public static readonly for = memoizeWith(
    (fileRW, ser, des) =>
      [fileRW.file, ser.toString(), des.toString()].join('@@'),
    <_Public extends Obj, _BaseRW extends IFileRW>(
      baseRW: _BaseRW,
      serialize: (
        value: ReadonlyDeep<_Public>,
      ) => ReadonlyDeep<IFileRW.In<_BaseRW>>,
      deserialize: (
        value: ReadonlyDeep<IFileRW.Out<_BaseRW>>,
      ) => ReadonlyDeep<_Public>,
    ) => new this(baseRW, serialize, deserialize),
  );
  public get file() {
    return this._baseRW.file;
  }

  private constructor(
    private readonly _baseRW: BaseRW,
    private readonly _serialize: (
      value: ReadonlyDeep<Public>,
    ) => ReadonlyDeep<IFileRW.In<BaseRW>>,
    private readonly _deserialize: (
      value: ReadonlyDeep<IFileRW.Out<BaseRW>>,
    ) => ReadonlyDeep<Public>,
  ) {}
  async read() {
    const value = await this._baseRW.read();
    return value
      ? this._deserialize(value as ReadonlyDeep<IFileRW.Out<BaseRW>>)
      : false;
  }
  write(value: ReadonlyDeep<Public>): Promise<void> {
    return this._baseRW.write(this._serialize(value));
  }
  rm(): Promise<void> {
    return this._baseRW.rm();
  }
}

const encodeProfileName = (profileName: string) =>
  encodeURIComponent(profileName).replaceAll('.', '%2e');
const decodeProfileName = (profileNameEncoded: string) =>
  decodeURIComponent(profileNameEncoded).replaceAll('%2e', '.');

export class Datastore {
  private static readonly _PREFERENCES_FILE = `${documentDirectory}/preferences.json`;
  private static readonly _PROFILES_DIR = `${documentDirectory}/profiles`;
  public constructor() {}

  public readonly preferences = FileRW.for<Preferences>(
    Datastore._PREFERENCES_FILE,
  );

  private _profile(name: string): FileRW<Omit<Profile, 'name'>> {
    const fileRw = FileRW.for<Omit<Profile, 'name'>>(
      `${Datastore._PROFILES_DIR}/${encodeProfileName(name)}.json`,
    );
    return fileRw;
  }

  public profile(name: string): IFileRW<Profile.Current> {
    const innerRw = this._profile(name);
    return CompositeFileRW.for<Profile.Current, FileRW<Omit<Profile, 'name'>>>(
      innerRw,
      value => {
        assert(value.name === name);
        return {
          ...omit(['name'], value),
          version: 1 as const,
          timelines: value.timelines?.map(t => ({
            ...t,
            operations: t.operations
              .slice()
              .map(op => {
                if (op.type === Operation.Type.Recurring) {
                  return {
                    ...op,
                    date: roundDate(op.date),
                    until: op.until ? roundDate(op.until) : undefined,
                  };
                }
                return {
                  ...op,
                  date: roundDate(op.date),
                };
              })
              .sort(sortUsing(op => op.date.getTime())),
          })),
        };
      },
      value => {
        if (value.version === 1) {
          return {
            ...value,
            name,
            timelines: value.timelines.map(timeline => ({
              ...timeline,
              operations: timeline.operations.map(operation => {
                if (operation.type === Operation.Type.Recurring) {
                  return {
                    ...operation,
                    date: roundDate(new Date(operation.date)),
                    until: operation.until
                      ? roundDate(new Date(operation.until))
                      : undefined,
                  };
                }
                return {
                  ...operation,
                  date: new Date(operation.date),
                };
              }),
            })),
          };
        }
        assert.fail(`Unsupported version ${value.version}`);
      },
    );
  }

  public async listProfiles() {
    const infos = await getInfoAsync(Datastore._PROFILES_DIR);
    console.log(infos);
    if (!infos.exists) {
      await makeDirectoryAsync(Datastore._PROFILES_DIR, {intermediates: true});
      return [];
    }
    const profiles = await readDirectoryAsync(Datastore._PROFILES_DIR);
    const preferences = await this.preferences.read();
    const preferredProfile =
      preferences === false ? null : preferences.defaultProfileName;
    return profiles
      .map(p => decodeProfileName(basename(p, '.json')))
      .map(name => ({
        name,
        isDefault: preferredProfile === name,
      }));
  }

  public async saveProfile({name, timelines}: Profile.Current) {
    const fileRw = this._profile(name);
    await fileRw.write({timelines: timelines, version: 1});
  }

  public async createProfile(name: string, asDefault = false) {
    await this.saveProfile({name, timelines: []});
    if (asDefault) {
      await this.preferences.write({
        ...this.preferences.read(),
        defaultProfileName: name,
      });
    }
  }
}
