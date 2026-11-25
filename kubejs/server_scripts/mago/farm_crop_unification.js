
/**
 * Mago Farm - Crop Unification
 * Minecraft 1.21.1 / NeoForge / KubeJS
 *
 * 대표 재배:
 * FD: 토마토, 쌀
 * ED: 옥수수, 레몬
 * CD: 오이
 * KC: 칠리
 * FR: 차, 커피
 * BWG: 블루베리
 * FDL: 오렌지, 사과
 *
 * 고유 음식 및 가공 단계를 유지한다.
 */

ServerEvents.recipes(event => {
  const REPLACEMENTS = [
    ['kaleidoscope_cookery:tomato', 'farmersdelight:tomato'],
    ['kaleidoscope_cookery:tomato_seed', 'farmersdelight:tomato_seeds'],

    ['kaleidoscope_cookery:rice', 'farmersdelight:rice'],
    ['kaleidoscope_cookery:rice_panicle', 'farmersdelight:rice_panicle'],

    ['extradelight:cucumber', 'culturaldelights:cucumber'],
    ['extradelight:chili', 'kaleidoscope_cookery:red_chili'],

    ['fruitsdelight:blueberry', 'biomeswevegone:blueberries'],
    ['fruitsdelight:lemon', 'extradelight:lemon'],

    ['extradelight:orange', 'fruitsdelight:orange']
  ]

  REPLACEMENTS.forEach(pair => {
    event.replaceInput({}, pair[0], pair[1])
  })

  // 폐기한 중복 종자의 제작법 제거
  event.remove({
    output: 'kaleidoscope_cookery:tomato_seed'
  })

  event.remove({
    id: 'fruitsdelight:lemon_seeds'
  })

  event.remove({
    id: 'extradelight:chili_seeds'
  })

  // 재료를 생산하는 기존 조합 및 가공 출력도 통합
  const OUTPUTS = [
    ['kaleidoscope_cookery:rice', 'farmersdelight:rice'],
    ['kaleidoscope_cookery:rice_panicle', 'farmersdelight:rice_panicle'],

    ['extradelight:chili', 'kaleidoscope_cookery:red_chili'],

    ['fruitsdelight:lemon', 'extradelight:lemon'],
    ['fruitsdelight:blueberry', 'biomeswevegone:blueberries'],

    ['extradelight:orange', 'fruitsdelight:orange'],

    // ED 커피 체리 상자 해체 등을 FR 열매로 통합
    ['extradelight:coffee_cherries', 'farmersrespite:coffee_berries']
  ]

  OUTPUTS.forEach(pair => {
    event.replaceOutput({}, pair[0], pair[1])
  })

})

ServerEvents.tags('item', event => {
  // ED 칠리 가공
  event.add('c:crops/chili', 'kaleidoscope_cookery:red_chili')
  event.add('c:crops/chili', 'kaleidoscope_cookery:green_chili')
  event.remove('c:crops/chili', 'extradelight:chili')

  // FDL 레몬 가공
  event.add('c:foods/fruits/lemon', 'extradelight:lemon')
  event.remove('c:foods/fruits/lemon', 'fruitsdelight:lemon')

  // FDL 블루베리 가공
  event.add('c:foods/fruits/blueberry', 'biomeswevegone:blueberries')
  event.remove('c:foods/fruits/blueberry', 'fruitsdelight:blueberry')

  // ED 오렌지 착즙기/도마/오렌지 상자
  event.add('c:crops/orange', 'fruitsdelight:orange')
  event.remove('c:crops/orange', 'extradelight:orange')

  // FR 커피 열매 -> ED 건조대
  event.add('c:crops/coffee', 'farmersrespite:coffee_berries')
  event.remove('c:crops/coffee', 'extradelight:coffee_cherries')

  // FR 식재 종자는 로스팅 완료 원두나 생두가 아니다.
  event.remove('c:crops/coffee/green', 'farmersrespite:coffee_beans')
  event.remove('c:crops/coffee/cooked', 'farmersrespite:coffee_beans')
})

// 중복 원재료 및 묘목의 레시피 뷰어 표시만 숨김.
// 아이템 등록 자체를 삭제하거나 기존 월드를 변환하지 않는다.
RecipeViewerEvents.removeEntries('item', event => {
  const RETIRED = [
    'kaleidoscope_cookery:tomato',
    'kaleidoscope_cookery:tomato_seed',

    'kaleidoscope_cookery:rice',
    'kaleidoscope_cookery:rice_panicle',
    'kaleidoscope_cookery:wild_rice',

    'extradelight:chili',
    'extradelight:chili_seeds',

    'fruitsdelight:lemon',
    'fruitsdelight:lemon_seeds',
    'fruitsdelight:lemon_tree',

    'fruitsdelight:blueberry',

    'extradelight:orange',
    'extradelight:orange_sapling',

    'extradelight:apple_sapling',
    'biomeswevegone:orchard_sapling',

    'extradelight:coffee_cherries'
  ]

  RETIRED.forEach(id => event.remove(id))
})
