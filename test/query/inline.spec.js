const { createTestServer } = require('../utils');

const server = createTestServer();

const createResults = (classic, wod) =>
  [
    { title: 'Classic', description: classic },
    { title: 'World of Darkness', description: wod },
    { title: 'Random', description: 'd100' }
  ].filter(result => !!result.description);

async function matchResults(query, expected) {
  const results = await server.inline(query);
  expect(results.length).toEqual(3);
  results.forEach((result, index) =>
    expect(result).toMatchObject(expected[index])
  );
}

describe('Inline queries', () => {
  test('should return default articles for empty query', async () => {
    expect.assertions(12);

    const expected = createResults('d20', 'd10>6', 'd100');

    matchResults(undefined, expected);
    matchResults('', expected);
    matchResults('    ', expected);
  });
  /*
  test('should return `random` article for invalid query', async () => {
    expect.assertions(4);

    const expected = createResults();

    // should return null for classic parser
    matchResults('abc', expected);
  });
  */
});
