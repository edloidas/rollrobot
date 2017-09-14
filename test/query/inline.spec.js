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
  expect(results.length).toEqual(expected.length);
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

  test('should return `random` article for invalid query', async () => {
    expect.assertions(4);

    matchResults('abc', createResults());
    matchResults('🦆', createResults());
  });

  test('should return more than 2 articles', async () => {
    expect.assertions(14);

    matchResults('10', createResults('d10', null, 'd100'));
    matchResults('d20', createResults('d20', 'd20>6', 'd100'));
    matchResults('  11d11 ', createResults('11d11', '11d11>6', 'd100'));
    matchResults('4d10>5', createResults(null, '4d10>5', 'd100'));
  });

  test('should limit inline query roll values', async () => {
    expect.assertions(4);

    matchResults('d9999999', createResults('d99999', 'd99999>6', 'd100'));
  });
});
