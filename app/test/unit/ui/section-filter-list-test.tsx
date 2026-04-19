import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import * as React from 'react'

import { SectionFilterList } from '../../../src/ui/lib/section-filter-list'
import { IFilterListGroup, IFilterListItem } from '../../../src/ui/lib/filter-list'
import { IMatches } from '../../../src/lib/fuzzy-find'
import { render, act, screen, fireEvent } from '../../helpers/ui/render'

interface TestItem extends IFilterListItem {
  readonly id: string
  readonly name: string
  readonly path: string
  readonly text: ReadonlyArray<string>
}

const noMatches: IMatches = { title: [], subtitle: [], path: [] }

function createTestItem(id: string, name: string, path: string): TestItem {
  return {
    id,
    name,
    path,
    text: [name, name, path],
  }
}

function createTestGroups(): ReadonlyArray<IFilterListGroup<TestItem, string>> {
  return [
    {
      identifier: 'group1',
      items: [
        createTestItem('1', 'desktop', '/home/user/projects/desktop'),
        createTestItem('2', 'website', '/home/user/work/website'),
        createTestItem('3', 'api', '/home/user/code/api-service'),
      ],
    },
  ]
}

describe('SectionFilterList', () => {
  let selectionChanges: Array<{ item: TestItem | null; kind: string }> = []

  beforeEach(() => {
    selectionChanges = []
  })

  afterEach(() => {
    selectionChanges = []
  })

  describe('selection preservation during filtering', () => {
    it('should not call onSelectionChanged when filter text changes', () => {
      const groups = createTestGroups()
      const selectedItem = groups[0].items[0]

      const onSelectionChanged = (item: TestItem | null) => {
        selectionChanges.push({
          item,
          kind: 'callback',
        })
      }

      const { rerender } = render(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={selectedItem}
          filterText=""
          onFilterTextChanged={() => {}}
          onSelectionChanged={onSelectionChanged}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.equal(selectionChanges.length, 0)

      rerender(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={selectedItem}
          filterText="desktop"
          onFilterTextChanged={() => {}}
          onSelectionChanged={onSelectionChanged}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.equal(
        selectionChanges.length,
        0,
        'onSelectionChanged should not be called when filter text is applied'
      )

      rerender(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={selectedItem}
          filterText=""
          onFilterTextChanged={() => {}}
          onSelectionChanged={onSelectionChanged}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.equal(
        selectionChanges.length,
        0,
        'onSelectionChanged should not be called when filter text is cleared'
      )
    })

    it('should not change selection when filter excludes the selected item', () => {
      const groups = createTestGroups()
      const selectedItem = groups[0].items[0]

      const onSelectionChanged = (item: TestItem | null) => {
        selectionChanges.push({
          item,
          kind: 'callback',
        })
      }

      const { rerender } = render(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={selectedItem}
          filterText=""
          onFilterTextChanged={() => {}}
          onSelectionChanged={onSelectionChanged}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.equal(selectionChanges.length, 0)

      rerender(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={selectedItem}
          filterText="website"
          onFilterTextChanged={() => {}}
          onSelectionChanged={onSelectionChanged}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.equal(
        selectionChanges.length,
        0,
        'onSelectionChanged should not be called when selected item is filtered out'
      )

      rerender(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={selectedItem}
          filterText=""
          onFilterTextChanged={() => {}}
          onSelectionChanged={onSelectionChanged}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.equal(
        selectionChanges.length,
        0,
        'onSelectionChanged should not be called when filter is cleared and selected item is restored'
      )
    })
  })

  describe('path filtering', () => {
    it('should filter items by path substring', () => {
      const groups = createTestGroups()

      const { rerender } = render(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={null}
          filterText=""
          onFilterTextChanged={() => {}}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.ok(screen.getByTestId('item-1'))
      assert.ok(screen.getByTestId('item-2'))
      assert.ok(screen.getByTestId('item-3'))

      rerender(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={null}
          filterText="projects"
          onFilterTextChanged={() => {}}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.ok(screen.getByTestId('item-1'), 'desktop should match "projects" path')
      assert.throws(() => screen.getByTestId('item-2'), 'website should not match "projects" path')
      assert.throws(() => screen.getByTestId('item-3'), 'api should not match "projects" path')
    })

    it('should filter items by work directory in path', () => {
      const groups = createTestGroups()

      const { rerender } = render(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={null}
          filterText=""
          onFilterTextChanged={() => {}}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      rerender(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={null}
          filterText="work"
          onFilterTextChanged={() => {}}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.throws(() => screen.getByTestId('item-1'), 'desktop should not match "work" path')
      assert.ok(screen.getByTestId('item-2'), 'website should match "work" path')
      assert.throws(() => screen.getByTestId('item-3'), 'api should not match "work" path')
    })

    it('should filter items by code directory in path', () => {
      const groups = createTestGroups()

      const { rerender } = render(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={null}
          filterText=""
          onFilterTextChanged={() => {}}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      rerender(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={null}
          filterText="code"
          onFilterTextChanged={() => {}}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.throws(() => screen.getByTestId('item-1'), 'desktop should not match "code" path')
      assert.throws(() => screen.getByTestId('item-2'), 'website should not match "code" path')
      assert.ok(screen.getByTestId('item-3'), 'api should match "code" path')
    })

    it('should show all items when filter is cleared after path filtering', () => {
      const groups = createTestGroups()

      const { rerender } = render(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={null}
          filterText="projects"
          onFilterTextChanged={() => {}}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.ok(screen.getByTestId('item-1'))
      assert.throws(() => screen.getByTestId('item-2'))
      assert.throws(() => screen.getByTestId('item-3'))

      rerender(
        <SectionFilterList<TestItem, string>
          rowHeight={29}
          groups={groups}
          selectedItem={null}
          filterText=""
          onFilterTextChanged={() => {}}
          renderItem={(item: TestItem, matches: IMatches) => (
            <div data-testid={`item-${item.id}`}>{item.name}</div>
          )}
          invalidationProps={{}}
        />
      )

      assert.ok(screen.getByTestId('item-1'), 'desktop should be visible after clearing filter')
      assert.ok(screen.getByTestId('item-2'), 'website should be visible after clearing filter')
      assert.ok(screen.getByTestId('item-3'), 'api should be visible after clearing filter')
    })
  })
})
