import {fireEvent, render, screen} from '@testing-library/react-native';
import React from 'react';
import {ReactTestInstance} from 'react-test-renderer';

import BPForeignInteractionManager from './BPForeignInteractionManager';
import BPTextInput from './BPTextInput';

jest.useFakeTimers();

const ERR_COLOR = 'rgba(179, 38, 30, 1)';
const VALID_COLOR = 'rgba(103, 80, 164, 1)';

describe('Errors display', () => {
  it('should not display errors if none', () => {
    const validateMock = jest.fn(() => []);
    render(
      <BPForeignInteractionManager testID="touch-catcher">
        <BPTextInput validate={validateMock} testID="input" />
      </BPForeignInteractionManager>,
    );
    const input = screen.getByTestId('input');

    fireEvent.changeText(input, 'test');
    fireEvent.press(screen.getByTestId('touch-catcher'));

    expect(validateMock).toHaveBeenCalledTimes(1);
    expect(validateMock).toHaveBeenCalledWith('test');
    expect(input.props).toMatchObject({
      value: 'test',
      cursorColor: VALID_COLOR,
    });
  });
  it('should display errors on focus out', () => {
    const ERROR = 'ERR!';
    const validateMock = jest.fn(() => [ERROR]);
    render(
      <BPForeignInteractionManager testID="touch-catcher">
        <BPTextInput validate={validateMock} testID="input" />
      </BPForeignInteractionManager>,
    );
    const input = screen.getByTestId('input');

    fireEvent.changeText(input, 'test');
    expect(screen.queryAllByText(ERROR)).toHaveLength(0);
    fireEvent.press(screen.getByTestId('touch-catcher'));

    expect(screen.queryAllByText(ERROR)).toHaveLength(1);
    expect(validateMock).toHaveBeenCalledTimes(1);
    expect(validateMock).toHaveBeenCalledWith('test');
    expect(input.props).toMatchObject({value: 'test', cursorColor: ERR_COLOR});
  });
  describe('From error state', () => {
    const ORIGINAL_ERROR = 'Base error';
    let input: ReactTestInstance;
    let validateMock: jest.Mock<string[]>;
    beforeEach(() => {
      validateMock = jest.fn(() => [ORIGINAL_ERROR]);
      render(
        <BPForeignInteractionManager testID="touch-catcher">
          <BPTextInput validate={validateMock} testID="input" />
        </BPForeignInteractionManager>,
      );
      input = screen.getByTestId('input');
      fireEvent.changeText(input, 'test');
      fireEvent.press(screen.getByTestId('touch-catcher'));
      validateMock.mockClear();
    });
    it('should clear error immediately on fixed after focus out', () => {
      validateMock.mockReturnValue([]);

      fireEvent.changeText(input, 'test2');

      expect(screen.queryAllByText(ORIGINAL_ERROR)).toHaveLength(0);
      expect(validateMock).toHaveBeenCalledTimes(1);
      expect(validateMock).toHaveBeenCalledWith('test2');
      expect(input.props).toMatchObject({
        value: 'test2',
        cursorColor: VALID_COLOR,
      });
    });
    it('should re-add errors after fixed on focus out', () => {
      const ERR = 'ERR!';
      validateMock.mockReturnValue([ERR]);

      fireEvent.changeText(input, 'test2');
      fireEvent.press(screen.getByTestId('touch-catcher'));

      expect(screen.queryAllByText(ORIGINAL_ERROR)).toHaveLength(0);
      expect(screen.queryAllByText(ERR)).toHaveLength(1);
      expect(validateMock).toHaveBeenCalledTimes(1);
      expect(validateMock).toHaveBeenCalledWith('test2');
      expect(input.props).toMatchObject({
        value: 'test2',
        cursorColor: ERR_COLOR,
      });
    });
  });
});
