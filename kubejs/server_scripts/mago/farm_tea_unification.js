
/**
 * Mago - Tea Unification
 *
 * 대표 재배: Farmer's Respite
 * KC의 차 가공 및 제조 콘텐츠 유지
 */

ServerEvents.recipes(event => {
  // KC Fresh Tea Leaves 대신 FR Green Tea Leaves 사용
  event.replaceInput(
    {},
    'kaleidoscope_cookery:fresh_tea_leaves',
    'farmersrespite:green_tea_leaves'
  )

  // KC Fresh Tea Leaves 생산 레시피 제거
  event.remove({
    output: 'kaleidoscope_cookery:fresh_tea_leaves'
  })
})

// 더 이상 사용하지 않는 KC 차 재료를 JEI/REI/EMI에서 숨김
RecipeViewerEvents.removeEntries('item', event => {
  event.remove('kaleidoscope_cookery:tea_seed')
  event.remove('kaleidoscope_cookery:fresh_tea_leaves')
})
