const { regexp } = require('../../src/query/full');
const { error } = require('../../src/text');
const { createTestServer } = require('../utils');

const server = createTestServer();

describe('/full', () => {
  beforeEach(() => {
    server.setChatOptions();
  });

  test('should have valid RegExp', async () => {
    expect(regexp.exec('/full')).toBeTruthy();
    expect(regexp.exec('/full@rollrobot')).toBeTruthy();
    expect(regexp.exec('/full d20')[3]).toEqual(' d20');
    expect(regexp.exec('/full@rollrobot 6')[3]).toEqual(' 6');
  });

  test('should notify of invalid input for `/full` command', async () => {
    expect.assertions(4);

    await expect(server.send('/full')).resolves.toEqual(error);
    await expect(server.send('/full a')).resolves.toEqual(error);
    await expect(server.send('/full -7')).resolves.toEqual(error);
    await expect(server.send('/full 6d')).resolves.toEqual(error);
  });

  test('should parse and roll notation for `/full` command', async () => {
    expect.assertions(5);

    const matchingRegexp = /`\([\d+-dDf!>]+\)` \*\d+\* `\[\d+(?:,\d+)*\]`/;
    const matching = expect.stringMatching(matchingRegexp);

    await expect(server.send('/full 10')).resolves.toEqual(matching);
    await expect(server.send('/full d20')).resolves.toEqual(matching);
    await expect(server.send('/full d8!')).resolves.toEqual(matching);
    await expect(server.send('/full 4d20-1')).resolves.toEqual(matching);
    await expect(server.send('/full 3d10!>6f3')).resolves.toEqual(matching);
  });

  test('should parse and roll notation for `/full` command', async () => {
    server.setChatOptions({ type: 'group' });
    expect.assertions(5);

    const matchingRegexp = /`\([\d+-dDf!>]+\)` \*\d+\* `\[\d+(?:,\d+)*\]`/;
    const matching = expect.stringMatching(matchingRegexp);

    await expect(server.send('/full 10')).resolves.toEqual(matching);
    await expect(server.send('/full d20')).resolves.toEqual(matching);
    await expect(server.send('/full d8!')).resolves.toEqual(matching);
    await expect(server.send('/full 4d20-1')).resolves.toEqual(matching);
    await expect(server.send('/full 3d10!>6f3')).resolves.toEqual(matching);
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

    result = server.send('/full 100d1234567890+1234567890');
    await expect(result).resolves.toEqual(classicMatching);

    result = server.send('/full 77d7777777777-7777777777');
    await expect(result).resolves.toEqual(classicMatching);

    result = server.send('/full 999d1234567890!>7777777777f1111111111');
    await expect(result).resolves.toEqual(wodMatching);
  });
});
