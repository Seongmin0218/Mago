
/**
 * Mago Farm: Right-click Harvest XP
 * Minecraft 1.21.1 / NeoForge / KubeJS
 *
 * 좌클릭 XP: Puffish Skills experience.json
 * 우클릭 XP: 실제 수확 후 1틱 상태 검사
 *
 * 기존 모드의 수확 동작은 변경하지 않는다.
 */

;(function () {
  var SkillsAPI = Java.loadClass(
    'net.puffish.skillsmod.api.SkillsAPI'
  )
  var ResourceLocation = Java.loadClass(
    'net.minecraft.resources.ResourceLocation'
  )
  var BuiltInRegistries = Java.loadClass(
    'net.minecraft.core.registries.BuiltInRegistries'
  )

  var FARM_CATEGORY = ResourceLocation.parse('mago_skill:farm')

  var GRAPE_CROPS = [
    'kaleidoscope_tavern:grape_crop',
    'kaleidoscope_tavern:gold_grape_crop',
    'kaleidoscope_tavern:ice_grape_crop',
    'kaleidoscope_dim_wine:crimson_grape_crop',
    'kaleidoscope_dim_wine:warped_grape_crop'
  ]

  var COFFEE_STEMS = [
    'farmersrespite:coffee_stem',
    'farmersrespite:coffee_stem_middle',
    'farmersrespite:coffee_stem_double'
  ]

  var FD_TOMATOES = [
    'farmersdelight:tomatoes',
    'farmersdelight:tomatoes_on_rope'
  ]

  var FDL_FRUIT_LEAVES = [
    'fruitsdelight:apple_leaves',
    'fruitsdelight:bayberry_leaves',
    'fruitsdelight:fig_leaves',
    'fruitsdelight:hawberry_leaves',
    'fruitsdelight:kiwi_leaves',
    'fruitsdelight:lychee_leaves',
    'fruitsdelight:mango_leaves',
    'fruitsdelight:mangosteen_leaves',
    'fruitsdelight:orange_leaves',
    'fruitsdelight:peach_leaves',
    'fruitsdelight:pear_leaves',
    'fruitsdelight:persimmon_leaves'
  ]

  var pending = Object.create(null)

  function blockId(state) {
    return String(
      BuiltInRegistries.BLOCK.getKey(state.getBlock())
    )
  }

  function propertyValue(state, name) {
    var property = state.getBlock()
      .getStateDefinition()
      .getProperty(name)

    if (property == null) return null

    return String(state.getValue(property)).toLowerCase()
  }

  function giveFarmXp(player, amount, source) {
    var category = SkillsAPI.getCategory(FARM_CATEGORY)

    if (!category.isPresent()) {
      console.warn('[MagoFarmXP] 농부 카테고리 없음')
      return
    }

    var experience = category.get().getExperience()

    if (!experience.isPresent()) {
      console.warn('[MagoFarmXP] 농부 경험치 API 없음')
      return
    }

    experience.get().addTotal(player, amount)
    console.info(
      '[MagoFarmXP] ' + source + ' +' + amount + ' XP'
    )
  }

  BlockEvents.rightClicked(function (event) {
    var level = event.level
    if (level.isClientSide()) return

    var player = event.player
    if (player.isCreative()) return

    var pos = event.block.pos.immutable()
    var state = level.getBlockState(pos)
    var id = blockId(state)
    var itemId = String(event.item.id)

    var kind = null
    var xp = 0
    var half = null
    var coffeeAgeBefore = null
    var coffeeAge1Before = null

    // Farmer's Respite 차나무
    if (id === 'farmersrespite:tea_bush') {
      if (
        itemId !== 'minecraft:shears' ||
        propertyValue(state, 'age') !== '3'
      ) return

      kind = 'fr_tea'
      half = propertyValue(state, 'half')
      xp = 1
    }

    // Tavern / Dim Wine 포도
    else if (GRAPE_CROPS.indexOf(id) !== -1) {
      if (
        itemId !== 'minecraft:shears' ||
        propertyValue(state, 'age') !== '5'
      ) return

      kind = 'grape'
      xp = 2
    }

    // Farmer's Respite 커피
    else if (COFFEE_STEMS.indexOf(id) !== -1) {
      coffeeAgeBefore = propertyValue(state, 'age')
      coffeeAge1Before = propertyValue(state, 'age1')

      if (
        coffeeAgeBefore !== '2' &&
        coffeeAge1Before !== '2'
      ) return

      kind = 'fr_coffee'
      xp = 4
    }

    // Kaleidoscope Cookery 칠리
    else if (id === 'kaleidoscope_cookery:chili_crop') {
      if (propertyValue(state, 'age') !== '7') return

      kind = 'kc_chili'
      xp = 1
    }

    // 바닐라 달콤한 열매: 접촉 피해 고려 2 XP
    else if (id === 'minecraft:sweet_berry_bush') {
      var berryAge = propertyValue(state, 'age')

      if (berryAge !== '2' && berryAge !== '3') return

      kind = 'vanilla_sweet_berry'
      xp = 2
    }

    // BWG 블루베리
    else if (id === 'biomeswevegone:blueberry_bush') {
      var blueberryAge = propertyValue(state, 'age')

      if (
        blueberryAge !== '2' &&
        blueberryAge !== '3'
      ) return

      kind = 'bwg_blueberry'
      xp = 1
    }

    // Fruits Delight 크랜베리
    else if (id === 'fruitsdelight:cranberry_bush') {
      if (propertyValue(state, 'age') !== '4') return

      kind = 'fdl_cranberry'
      xp = 1
    }

    // Farmer's Delight 토마토
    else if (FD_TOMATOES.indexOf(id) !== -1) {
      if (propertyValue(state, 'age') !== '3') return

      kind = 'fd_tomato'
      xp = id === 'farmersdelight:tomatoes_on_rope'
        ? 2
        : 1
    }

    // Extra Delight 딸기
    else if (id === 'extradelight:strawberry_crop') {
      if (propertyValue(state, 'age') !== '3') return

      kind = 'ed_strawberry'
      xp = 1
    }

    // Extra Delight 레몬 과수
    else if (id === 'extradelight:lemon_leaves') {
      if (
        propertyValue(state, 'age') !== '3' ||
        propertyValue(state, 'persistent') !== 'false'
      ) return

      kind = 'ed_lemon_leaves'
      xp = 2
    }

    // Fruits Delight 고유 과수
    else if (FDL_FRUIT_LEAVES.indexOf(id) !== -1) {
      if (
        propertyValue(state, 'persistent') !== 'false' ||
        propertyValue(state, 'type') !== 'fruits'
      ) return

      kind = 'fdl_fruit_leaves'
      xp = 2
    }

    // Fruits Delight 두리안 과수
    else if (id === 'fruitsdelight:durian_leaves') {
      if (
        propertyValue(state, 'persistent') !== 'false' ||
        propertyValue(state, 'fruit') !== 'fruits'
      ) return

      kind = 'fdl_durian_leaves'
      xp = 2
    }

    // 바닐라 발광 열매
    else if (
      id === 'minecraft:cave_vines' ||
      id === 'minecraft:cave_vines_plant'
    ) {
      if (propertyValue(state, 'berries') !== 'true') return

      kind = 'glow_berries'
      xp = 2
    }

    else return

    var key = String(level) + '|' + String(pos)
    if (pending[key]) return
    pending[key] = true

    event.server.scheduleInTicks(1, function () {
      delete pending[key]

      try {
        var after = level.getBlockState(pos)
        var succeeded = false

        if (kind === 'fr_tea') {
          var basePos = half === 'upper'
            ? pos.below()
            : pos

          succeeded =
            blockId(level.getBlockState(basePos)) ===
            'farmersrespite:small_tea_bush'
        }

        else if (kind === 'grape') {
          succeeded = after.isAir()
        }

        else if (kind === 'fr_coffee') {
          succeeded = blockId(after) === id && (
            (
              coffeeAgeBefore === '2' &&
              propertyValue(after, 'age') === '0'
            ) ||
            (
              coffeeAge1Before === '2' &&
              propertyValue(after, 'age1') === '0'
            )
          )
        }

        else if (kind === 'kc_chili') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '5'
        }

        else if (
          kind === 'vanilla_sweet_berry' ||
          kind === 'bwg_blueberry'
        ) {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '1'
        }

        else if (kind === 'fdl_cranberry') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '2'
        }

        else if (
          kind === 'fd_tomato' ||
          kind === 'ed_lemon_leaves'
        ) {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '0'
        }

        else if (kind === 'ed_strawberry') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '1'
        }

        else if (kind === 'fdl_fruit_leaves') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'type') === 'leaves'
        }

        else if (kind === 'fdl_durian_leaves') {
          succeeded =
            after.isAir() ||
            (
              blockId(after) === id &&
              propertyValue(after, 'fruit') === 'none'
            )
        }

        else if (kind === 'glow_berries') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'berries') === 'false'
        }

        if (succeeded) {
          giveFarmXp(player, xp, id)
        }

      } catch (error) {
        console.error(
          '[MagoFarmXP] 수확 확인/XP 지급 실패: ' +
          error
        )
      }
    })
  })
})()
