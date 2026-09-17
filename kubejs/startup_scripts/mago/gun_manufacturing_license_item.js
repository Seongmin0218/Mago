// Mago - Gun Manufacturing License Item

StartupEvents.registry('item', event => {
  console.info('[Mago] Registering gun_manufacturing_license')

  event.create('kubejs:gun_manufacturing_license')
    .displayName('총기 제작 라이선스')
    .maxStackSize(1)
    .rarity('rare')
    .glow(true)
    .texture('minecraft:item/paper')
    .tooltip('§7거너 전문화 취득 시 지급되는 총기 제작 자격증입니다.')
    .tooltip('§7우클릭하여 총기 제작 자격을 영구 활성화합니다.')
    .tooltip('§8활성화해도 아이템은 소모되지 않습니다.')
    .tooltip('§8분실 시 재발급받을 수 있습니다.')
})