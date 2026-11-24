
/**
 * Mago Farm - Crop Unification
 *
 * 중복 농산물의 제작법 입출력을 대표 작물로 통합한다.
 *
 * - 기존 음식 및 가공 공정 유지
 * - 서로 다른 품종 및 가공 단계 보존
 * - 월드 생성과 모험 전리품은 별도 관리
 *
 * Minecraft 1.21.1 / NeoForge / KubeJS
 */

ServerEvents.recipes(event => {
  const REPLACEMENTS = [
    // 토마토: KC -> Farmer's Delight
    [
      'kaleidoscope_cookery:tomato',
      'farmersdelight:tomato'
    ],
    [
      'kaleidoscope_cookery:tomato_seed',
      'farmersdelight:tomato_seeds'
    ],

    // 쌀: KC -> Farmer's Delight
    [
      'kaleidoscope_cookery:rice',
      'farmersdelight:rice'
    ],
    [
      'kaleidoscope_cookery:rice_panicle',
      'farmersdelight:rice_panicle'
    ],

    // 오이: ED -> Cultural Delights
    [
      'extradelight:cucumber',
      'culturaldelights:cucumber'
    ],

    // 칠리: ED -> Kaleidoscope Cookery
    [
      'extradelight:chili',
      'kaleidoscope_cookery:red_chili'
    ],

    // 블루베리: FDL -> BWG
    [
      'fruitsdelight:blueberry',
      'biomeswevegone:blueberries'
    ],

    // 레몬: FDL -> Extra Delight
    [
      'fruitsdelight:lemon',
      'extradelight:lemon'
    ],

    // 오렌지: ED -> Fruits Delight
    [
      'extradelight:orange',
      'fruitsdelight:orange'
    ]
  ]

  REPLACEMENTS.forEach(pair => {
    event.replaceInput({}, pair[0], pair[1])
  })

  // 중복 씨앗 제작법 제거
  event.remove({
    output: 'kaleidoscope_cookery:tomato_seed'
  })

    // FDL 레몬 상자 해체 등에서 ED 레몬을 반환
  event.replaceOutput(
    {},
    'fruitsdelight:lemon',
    'extradelight:lemon'
  )

  // FDL 레몬 씨앗 제작법 제거
  event.remove({
    id: 'fruitsdelight:lemon_seeds'
  })

  event.remove({
    id: 'extradelight:chili_seeds'
  })

  // 중복 원재료를 생산하는 제작법 출력 변경
  event.replaceOutput(
    {},
    'kaleidoscope_cookery:rice',
    'farmersdelight:rice'
  )

  event.replaceOutput(
    {},
    'kaleidoscope_cookery:rice_panicle',
    'farmersdelight:rice_panicle'
  )

  event.replaceOutput(
    {},
    'extradelight:chili',
    'kaleidoscope_cookery:red_chili'
  )
})

// ED 건조대 및 가공 레시피에서 KC 칠리를 사용하게 한다.
ServerEvents.tags('item', event => {
  event.add(
    'c:crops/chili',
    'kaleidoscope_cookery:red_chili'
  )

  event.add(
    'c:crops/chili',
    'kaleidoscope_cookery:green_chili'
  )

  event.remove(
    'c:crops/chili',
    'extradelight:chili'
  )
})

ServerEvents.tags('item', event => {
  // FDL 레몬 가공 레시피에 ED 레몬 사용
  event.add(
    'c:foods/fruits/lemon',
    'extradelight:lemon'
  )

  // 중복 레몬을 대표 과일 태그에서 제외
  event.remove(
    'c:foods/fruits/lemon',
    'fruitsdelight:lemon'
  )
})

// 중복 원재료와 씨앗의 JEI/REI/EMI 표시 숨김
RecipeViewerEvents.removeEntries('item', event => {
  // 토마토
  event.remove('kaleidoscope_cookery:tomato')
  event.remove('kaleidoscope_cookery:tomato_seed')

  // 쌀
  event.remove('kaleidoscope_cookery:rice')
  event.remove('kaleidoscope_cookery:rice_panicle')
  event.remove('kaleidoscope_cookery:wild_rice')

  // 칠리
  event.remove('extradelight:chili')
  event.remove('extradelight:chili_seeds')

    // FDL 레몬 원재료 및 재배 경로 숨김
  event.remove('fruitsdelight:lemon')
  event.remove('fruitsdelight:lemon_seeds')
  event.remove('fruitsdelight:lemon_tree')
})
