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
import {Profile} from '@budget-planner/models';
import {isNil, memoizeWith} from 'ramda';
import {ReadonlyDeep} from 'type-fest';

type Preferences = {
  defaultProfileName?: string;
};

const fileRW = memoizeWith(
  (file: string) => file,
  <T extends Record<any, unknown>>(file: string) => {
    let cache: ReadonlyDeep<T> | null = null;
    return {
      read: async () => {
        if (cache) {
          return cache;
        }
        try {
          const content = await readAsStringAsync(file);
          if (content) {
            cache = JSON.parse(content);
            return cache!;
          }
          return false;
        } catch (e: any) {
          console.error(e, e instanceof Error, e.name);
          throw e;
        }
      },
      write: async (value: T) => {
        assert(typeof value === 'object' && !isNil(value));
        console.log('WRITE', file, value);
        await makeDirectoryAsync(dirname(file), {intermediates: true});
        await writeAsStringAsync(file, JSON.stringify(value));
        cache = value as ReadonlyDeep<T>;
      },
      rm: async () => {
        await deleteAsync(file, {idempotent: true});
        cache = null;
      },
    };
  },
);

const encodeProfileName = (profileName: string) =>
  encodeURIComponent(profileName).replaceAll('.', '%2e');
const decodeProfileName = (profileNameEncoded: string) =>
  decodeURIComponent(profileNameEncoded).replaceAll('%2e', '.');

export class Datastore {
  private static readonly _PREFERENCES_FILE = `${documentDirectory}/preferences.json`;
  private static readonly _PROFILES_DIR = `${documentDirectory}/profiles`;
  public constructor() {}

  public readonly preferences = fileRW<Preferences>(
    Datastore._PREFERENCES_FILE,
  );

  private _resolve(path: string) {
    return `${Datastore._PROFILES_DIR}/${path}`;
  }
  //   public async loadDefaultProfile(): Promise<Profile> {
  //     try {
  //       return await this.loadProfile('DEFAULT');
  //     } catch (e: unknown) {
  //       return this.initProfile();
  //     }
  //   }
  //   public async loadProfile(profileName: string): Promise<Profile> {
  //     assert(profileName.match(/^[a-zA-Z0-9-_]+$/));
  //     const contentStr = await readAsStringAsync(`${profileName}.json`);
  //     const profile = JSON.parse(contentStr);
  //     return {name: 'test', timelines: []};
  //   }

  //   public initProfile(): Profile {
  //     return {name: 'test', timelines: []};
  //   }

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
    const fileRw = fileRW<Omit<Profile, 'name'>>(
      `${Datastore._PROFILES_DIR}/${encodeProfileName(name)}.json`,
    );
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
