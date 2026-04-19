import { describe, it } from 'node:test'
import assert from 'node:assert'
import { match, IMatches } from '../../src/lib/fuzzy-find'
import { getText } from '../../src/ui/lib/filter-list'
describe('fuzzy find', () => {
  const items = [
    {
      id: '300',
      text: ['add fix for ...', 'opened 5 days ago by bob'],
    },
    {
      id: '500',
      text: ['add support', '#4653 opened 3 days ago by damaneice '],
    },
    {
      id: '500',
      text: ['add an awesome feature', '#7564 opened 10 days ago by ... '],
    },
  ]

  it('should find matching item when searching by pull request number', () => {
    const results = match('4653', items, getText)

    assert.equal(results.length, 1)
    assert(results[0].item['text'].join('').includes('4653'))
  })

  it('should find matching item when searching by author', () => {
    const results = match('damaneice', items, getText)

    assert.equal(results.length, 1)
    assert(results[0].item['text'].join('').includes('damaneice'))
  })

  it('should find matching item when by title', () => {
    const results = match('awesome feature', items, getText)

    assert.equal(results.length, 1)
    assert(results[0].item['text'].join('').includes('awesome feature'))
  })

  it('should find nothing', () => {
    const results = match('$%^', items, getText)

    assert.equal(results.length, 0)
  })

  describe('path matching', () => {
    const repoItems = [
      {
        id: '1',
        text: ['desktop', 'github/desktop', '/home/user/projects/desktop'],
      },
      {
        id: '2',
        text: ['website', 'github/website', '/home/user/work/website'],
      },
      {
        id: '3',
        text: ['api', 'company/api', '/home/user/code/api-service'],
      },
    ]

    it('should find matching item when searching by path substring', () => {
      const results = match('projects', repoItems, getText)

      assert.equal(results.length, 1)
      assert.equal(results[0].item.id, '1')
      assert(results[0].item['text'][2].includes('projects'))
    })

    it('should find matching item when searching by work directory', () => {
      const results = match('work', repoItems, getText)

      assert.equal(results.length, 1)
      assert.equal(results[0].item.id, '2')
    })

    it('should match path with case-insensitive fuzzy search', () => {
      const results = match('apisvc', repoItems, getText)

      assert.equal(results.length, 1)
      assert.equal(results[0].item.id, '3')
    })

    it('should return path matches with correct match indices', () => {
      const results = match('desktop', repoItems, getText)

      assert.equal(results.length, 1)
      const matches: IMatches = results[0].matches
      assert.ok(matches.title.length > 0)
      assert.ok(matches.subtitle.length > 0)
      assert.ok(matches.path.length > 0)
    })

    it('should find items by name even when path also matches', () => {
      const results = match('desktop', repoItems, getText)

      assert.equal(results.length, 1)
      assert.equal(results[0].item.id, '1')
    })
  })
})
