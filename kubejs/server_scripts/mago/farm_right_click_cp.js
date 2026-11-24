
/**
 * Mago Farm: Right-click Harvest XP
 * Minecraft 1.21.1 / NeoForge / KubeJS
 *
 * 좌클릭은 Puffish Skills experience.json이 담당.
 * 원래 모드의 수확을 변경하지 않고, 1틱 뒤 상태 변화만 검사.
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

  // Fruits Delight 일반 과수 잎.
  // 두리안은 별도의 fruit 속성을 사용하므로 아래에서 따로 처리.
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

  // 동일한 위치에서 중복 수확 XP를 지급하지 않도록 방지.
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

    if (property == null) {
      return null
    }

    return String(
      state.getValue(property)
    ).toLowerCase()
  }

  function giveFarmXp(player, amount, source) {
    var category = SkillsAPI.getCategory(FARM_CATEGORY)

    if (!category.isPresent()) {
      console.warn(
        '[MagoFarmXP] 농부 카테고리가 없습니다: mago_skill:farm'
      )
      return
    }

    var experience = category.get().getExperience()

    if (!experience.isPresent()) {
      console.warn(
        '[MagoFarmXP] 농부 경험치 API를 찾지 못했습니다.'
      )
      return
    }

    experience.get().addTotal(player, amount)

    console.info(
      '[MagoFarmXP] ' + source + ' +' + amount + ' XP'
    )
  }

  BlockEvents.rightClicked(function (event) {
    var level = event.level

    if (level.isClientSide()) {
      return
    }

    var player = event.player

    if (player.isCreative()) {
      return
    }

    var pos = event.block.pos.immutable()
    var state = level.getBlockState(pos)
    var id = blockId(state)
    var itemId = String(event.item.id)

    var kind = null
    var xp = 0
    var half = null
    var coffeeAgeBefore = null
    var coffeeAge1Before = null

    // 1. Farmer's Respite 차나무
    // 기존 검증된 가위 수확 조건 유지.
    if (id === 'farmersrespite:tea_bush') {
      if (itemId !== 'minecraft:shears') {
        return
      }

      if (propertyValue(state, 'age') !== '3') {
        return
      }

      kind = 'fr_tea'
      half = propertyValue(state, 'half')
      xp = 1
    }

    // 2. Tavern / Dim Wine 포도
    else if (GRAPE_CROPS.indexOf(id) !== -1) {
      if (itemId !== 'minecraft:shears') {
        return
      }

      if (propertyValue(state, 'age') !== '5') {
        return
      }

      kind = 'grape'
      xp = 2
    }

    // 3. Farmer's Respite 커피
    else if (COFFEE_STEMS.indexOf(id) !== -1) {
      coffeeAgeBefore = propertyValue(state, 'age')
      coffeeAge1Before = propertyValue(state, 'age1')

      if (
        coffeeAgeBefore !== '2' &&
        coffeeAge1Before !== '2'
      ) {
        return
      }

      kind = 'fr_coffee'
      xp = 4
    }

    // 4. Kaleidoscope Cookery 고추
    else if (id === 'kaleidoscope_cookery:chili_crop') {
      if (propertyValue(state, 'age') !== '7') {
        return
      }

      kind = 'kc_chili'
      xp = 1
    }

    // 5. 바닐라 달콤한 열매
    else if (id === 'minecraft:sweet_berry_bush') {
      var berryAge = propertyValue(state, 'age')

      if (berryAge !== '2' && berryAge !== '3') {
        return
      }

      kind = 'vanilla_sweet_berry'
      xp = 2
    }

    // 6. BWG 블루베리
    else if (id === 'biomeswevegone:blueberry_bush') {
      var blueberryAge = propertyValue(state, 'age')

      if (blueberryAge !== '2' && blueberryAge !== '3') {
        return
      }

      kind = 'bwg_blueberry'
      xp = 1
    }

    // 7. Fruits Delight 크랜베리
    else if (id === 'fruitsdelight:cranberry_bush') {
      if (propertyValue(state, 'age') !== '4') {
        return
      }

      kind = 'fdl_cranberry'
      xp = 1
    }

    // 8. Farmer's Delight 토마토
    // 일반 토마토 1 XP, 지지대 토마토 2 XP.
    else if (FD_TOMATOES.indexOf(id) !== -1) {
      if (propertyValue(state, 'age') !== '3') {
        return
      }

      kind = 'fd_tomato'
      xp = id === 'farmersdelight:tomatoes_on_rope'
        ? 2
        : 1
    }

    // 9. Kaleidoscope Cookery 토마토
    else if (id === 'kaleidoscope_cookery:tomato_crop') {
      if (propertyValue(state, 'age') !== '7') {
        return
      }

      kind = 'kc_tomato'
      xp = 1
    }

    // 10. Extra Delight 딸기
    else if (id === 'extradelight:strawberry_crop') {
      if (propertyValue(state, 'age') !== '3') {
        return
      }

      kind = 'ed_strawberry'
      xp = 1
    }

    // 11. Fruits Delight 블루베리
    else if (id === 'fruitsdelight:blueberry_bush') {
      if (propertyValue(state, 'age') !== '4') {
        return
      }

      kind = 'fdl_blueberry'
      xp = 1
    }

    // 12. Fruits Delight 레몬나무
    // 상단 클릭도 하단의 성장 상태를 기준으로 판정.
    else if (id === 'fruitsdelight:lemon_tree') {
      half = propertyValue(state, 'half')

      var lemonBasePos =
        half === 'upper'
          ? pos.below()
          : pos

      var lemonBase = level.getBlockState(lemonBasePos)

      if (
        blockId(lemonBase) !== id ||
        propertyValue(lemonBase, 'age') !== '4'
      ) {
        return
      }

      kind = 'fdl_lemon'
      xp = 2
    }

    // 13. Fruits Delight 일반 과수 잎
    else if (FDL_FRUIT_LEAVES.indexOf(id) !== -1) {
      if (propertyValue(state, 'persistent') !== 'false') {
        return
      }

      if (propertyValue(state, 'type') !== 'fruits') {
        return
      }

      kind = 'fdl_fruit_leaves'
      xp = 2
    }

    // 14. Fruits Delight 두리안나무 잎
    else if (id === 'fruitsdelight:durian_leaves') {
      if (propertyValue(state, 'persistent') !== 'false') {
        return
      }

      if (propertyValue(state, 'fruit') !== 'fruits') {
        return
      }

      kind = 'fdl_durian_leaves'
      xp = 2
    }

    // 15. 바닐라 발광 열매 덩굴
    else if (
      id === 'minecraft:cave_vines' ||
      id === 'minecraft:cave_vines_plant'
    ) {
      if (propertyValue(state, 'berries') !== 'true') {
        return
      }

      kind = 'glow_berries'
      xp = 2
    }

    else {
      return
    }

    var key =
      String(level) +
      '|' +
      String(pos)

    if (pending[key]) {
      return
    }

    pending[key] = true

    // 원래 모드의 수확 처리가 끝난 후 상태를 검사한다.
    event.server.scheduleInTicks(1, function () {
      delete pending[key]

      try {
        var after = level.getBlockState(pos)
        var succeeded = false

        if (kind === 'fr_tea') {
          var basePos =
            half === 'upper'
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
          succeeded =
            blockId(after) === id &&
            (
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

        else if (
          kind === 'kc_chili' ||
          kind === 'kc_tomato'
        ) {
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

        else if (
          kind === 'fdl_cranberry' ||
          kind === 'fdl_blueberry'
        ) {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '2'
        }

        else if (kind === 'fd_tomato') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '0'
        }

        else if (kind === 'ed_strawberry') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '1'
        }

        else if (kind === 'fdl_lemon') {
          var afterLemonPos =
            half === 'upper'
              ? pos.below()
              : pos

          var afterLemon = level.getBlockState(afterLemonPos)

          succeeded =
            blockId(afterLemon) === id &&
            propertyValue(afterLemon, 'age') === '2'
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

        // 실제 수확 성공 시에만 XP 지급.
        if (succeeded) {
          giveFarmXp(player, xp, id)
        }

      } catch (error) {
        console.error(
          '[MagoFarmXP] 수확 확인/경험치 지급 실패: ' +
          error
        )
      }
    })
  })
})()
