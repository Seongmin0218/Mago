
/**
 * Mago Farm - Crop Unification
 *
 * 중복 농산물의 제작법 입력을 대표 작물로 통합한다.
 *
 * - 기존 완성 음식 및 가공 공정 유지
 * - 서로 다른 품종 및 가공 단계 보존
 * - 대표 작물 씨앗/수확 경로 제거는 별도 데이터팩에서 처리
 *
 * Minecraft 1.21.1 / NeoForge / KubeJS
 */

ServerEvents.recipes(event => {
  const REPLACEMENTS = [
    // 토마토: Kaleidoscope Cookery -> Farmer's Delight
    [
      'kaleidoscope_cookery:tomato',
      'farmersdelight:tomato'
    ],
    [
      'kaleidoscope_cookery:tomato_seed',
      'farmersdelight:tomato_seeds'
    ],

    // 쌀: Kaleidoscope Cookery -> Farmer's Delight
    // KC cooked_rice 완성품은 그대로 유지
    [
      'kaleidoscope_cookery:rice',
      'farmersdelight:rice'
    ],

    // 오이: Extra Delight -> Cultural Delights
    [
      'extradelight:cucumber',
      'culturaldelights:cucumber'
    ],

    // 칠리: Extra Delight -> Kaleidoscope Cookery
    // ED 건조 칠리·분말 등의 가공품은 유지
    [
      'extradelight:chili',
      'kaleidoscope_cookery:red_chili'
    ],

    // 블루베리: Fruits Delight -> BWG
    [
      'fruitsdelight:blueberry',
      'biomeswevegone:blueberries'
    ],

    // 레몬: Fruits Delight -> Extra Delight
    [
      'fruitsdelight:lemon',
      'extradelight:lemon'
    ],

    // 오렌지: Extra Delight -> Fruits Delight
    [
      'extradelight:orange',
      'fruitsdelight:orange'
    ]
  ]

  // 기존 모드의 제작법을 유지하면서 원재료만 교체한다.
  REPLACEMENTS.forEach(pair => {
    event.replaceInput({}, pair[0], pair[1])
  })

  // KC 토마토를 FD 토마토 대표로 통합한다.
  // KC 토마토에서 KC 토마토 씨앗을 다시 만드는 제작법 제거.
  event.remove({
    output: 'kaleidoscope_cookery:tomato_seed'
  })
})

// =========================================================
// 중복 농산물 JEI/REI/EMI 표시 숨김
// =========================================================
RecipeViewerEvents.removeEntries('item', event => {
  // 대표 작물: Farmer's Delight 토마토
  event.remove('kaleidoscope_cookery:tomato')
  event.remove('kaleidoscope_cookery:tomato_seed')
})