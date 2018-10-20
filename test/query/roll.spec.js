const { regexp } = require('../../src/query/roll');
const { error } = require('../../src/text');
const { createTestServer } = require('../utils');

const server = createTestServer();

describe('/roll', () => {
  test('should have valid RegExp', async () => {
    expect(regexp.exec('/roll')).toBeTruthy();
    expect(regexp.exec('/roll@rollrobot')).toBeTruthy();
    expect(regexp.exec('/roll d20')[3]).toEqual(' d20');
    expect(regexp.exec('/roll@rollrobot 6')[3]).toEqual(' 6');
  });

  test('should notify of invalid input for `/roll` command', async () => {
    expect.assertions(4);

    await expect(server.send('/roll')).resolves.toEqual(error);
    await expect(server.send('/roll a')).resolves.toEqual(error);
    await expect(server.send('/roll -7')).resolves.toEqual(error);
    await expect(server.send('/roll 6d')).resolves.toEqual(error);
  });

  test('should parse and roll notation for `/roll` command', async () => {
    expect.assertions(5);

    const matching = expect.stringMatching(/`\([\d+-dDf!>]+\)` \*\d+\*/);

    await expect(server.send('/roll 10')).resolves.toEqual(matching);
    await expect(server.send('/roll d20')).resolves.toEqual(matching);
    await expect(server.send('/roll d8!')).resolves.toEqual(matching);
    await expect(server.send('/roll 4d20-1')).resolves.toEqual(matching);
    await expect(server.send('/roll 3d10!>6f3')).resolves.toEqual(matching);
  });

  test('should limit roll values', async () => {
    expect.assertions(3);

    const classicMatching = expect.stringMatching(
      /`\(12d999999999(\+|-)999999999\)` \*\d+\*/
    );
    const wodMatching = expect.stringMatching(
      /`\(12d999999999!>999999999f999999998\)` \*\d+\*/
    );

    let result;

    result = server.send('/roll 100d1234567890+1234567890');
    await expect(result).resolves.toEqual(classicMatching);

    result = server.send('/roll 77d7777777777-7777777777');
    await expect(result).resolves.toEqual(classicMatching);

    result = server.send('/roll 999d1234567890!>7777777777f1111111111');
    await expect(result).resolves.toEqual(wodMatching);
  });
});
