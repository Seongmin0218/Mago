ServerEvents.recipes(event => {
    const tripleBow = 'twilightforest:triple_bow'

    const dragonboneArrow = 'iceandfire:dragonbone_arrow'
    const dragonbone = 'iceandfire:dragonbone'
    const witherShard = 'iceandfire:wither_shard'
    const feather = 'minecraft:feather'


    // =========================================================
    // Twilight Forest Triple Bow retirement
    // =========================================================

    // 현재 1.21.1 Twilight Forest에서는 기본 제작법이 없지만,
    // 다른 모드/데이터팩이 제작법을 추가하더라도 획득하지 못하게 한다.
    event.remove({
        output: tripleBow
    })

    // Triple Bow를 재료로 사용하는 업그레이드/파생 제작법도 제거한다.
    event.remove({
        input: tripleBow
    })


    // =========================================================
    // Ice and Fire Dragon Bone Arrow
    // =========================================================

    // 기존 제작법 전부 제거
    event.remove({
        output: dragonboneArrow
    })


    /*
     * Mago 제작법
     *
     * Dragon Bone + Wither Shard + Feather
     * -> Dragon Bone Arrow x5
     *
     * 기존 Dragon Bone Arrow의 생산량 5개는 유지한다.
     */
    event.shapeless(
        Item.of(dragonboneArrow, 5),
        [
            dragonbone,
            witherShard,
            feather
        ]
    ).id('kubejs:mago/dragonbone_arrow')
})