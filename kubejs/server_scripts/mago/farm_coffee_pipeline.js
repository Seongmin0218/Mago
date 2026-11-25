/**
 * Mago Coffee Pipeline
 * FR 재배 → ED 건조 → 로스팅 → 분쇄 → FR 주전자
 *
 * FR coffee_beans는 식재용 종자로 유지한다.
 */

ServerEvents.tags('item', event => {
  // FR 식재 종자를 ED 생두 가공용 원재료에서 제외
  event.remove(
    'c:crops/coffee',
    'farmersrespite:coffee_beans'
  )

  // FR 커피 열매를 ED 건조대에서 사용 가능하게 한다.
  event.add(
    'c:crops/coffee',
    'farmersrespite:coffee_berries'
  )
})