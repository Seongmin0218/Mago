
/**
 * Mago Farm: Right-click Harvest XP
 *
 * Minecraft 1.21.1 / NeoForge / KubeJS
 *
 * - FR 차나무 가위 우클릭: 1 XP
 * - Tavern / Dim Wine 포도 가위 우클릭: 2 XP
 * - FR 커피 열매 우클릭: 4 XP
 *
 * 좌클릭 XP는 기존 Puffish Skills experience.json이 담당한다.
 * 이 스크립트는 기존 작물의 수확 동작을 변경하지 않는다.
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

  var FARM_CATEGORY = ResourceLocation.parse(
    'mago_skill:farm'
  )

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

  // 동일한 수확에 대해 중복 XP가 지급되지 않도록 기록.
  var pending = Object.create(null)

  function blockId(state) {
    return String(
      BuiltInRegistries.BLOCK.getKey(
        state.getBlock()
      )
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
    var category = SkillsAPI.getCategory(
      FARM_CATEGORY
    )

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
      '[MagoFarmXP] ' +
      source +
      ' +' + amount + ' XP'
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
    // 가위 수확 후 작은 차나무로 돌아가는지 확인.
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

    // 2. 포도송이
    // 가위 우클릭으로 성숙한 포도송이를 제거.
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

    // 3. Farmer's Respite 커피 줄기
    // 수확 성공 시 age 또는 age1이 0으로 초기화되는지 확인.
    else if (COFFEE_STEMS.indexOf(id) !== -1) {
      coffeeAgeBefore = propertyValue(state, 'age')
      coffeeAge1Before = propertyValue(state, 'age1')

      if (coffeeAgeBefore !== '2' && coffeeAge1Before !== '2') {
        return
      }

      kind = 'fr_coffee'
      xp = 4
    }

    // 4. Kaleidoscope Cookery 고추
    // 완전히 성숙한 고추를 수확하면 age=5로 돌아간다.
    else if (id === 'kaleidoscope_cookery:chili_crop') {
      if (propertyValue(state, 'age') !== '7') {
        return
      }

      kind = 'kc_chili'
      xp = 1
    }

    // 5. 바닐라 달콤한 열매
    // age=2 또는 3에서 우클릭 수확 가능.
    else if (id === 'minecraft:sweet_berry_bush') {
      var berryAge = propertyValue(state, 'age')

      if (berryAge !== '2' && berryAge !== '3') {
        return
      }

      kind = 'vanilla_sweet_berry'
      xp = 2
    }

    // 6. BWG 블루베리
    // age=2 또는 3에서 우클릭 수확 가능.
    else if (id === 'biomeswevegone:blueberry_bush') {
      var blueberryAge = propertyValue(state, 'age')

      if (blueberryAge !== '2' && blueberryAge !== '3') {
        return
      }

      kind = 'bwg_blueberry'
      xp = 1
    }

    // 7. Fruits Delight 크랜베리
    // age=4에서 수확하면 age=2로 돌아간다.
    else if (id === 'fruitsdelight:cranberry_bush') {
      if (propertyValue(state, 'age') !== '4') {
        return
      }

      kind = 'fdl_cranberry'
      xp = 1
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

    // 원래 모드의 수확 처리가 끝난 후 상태 확인.
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
            blockId(
              level.getBlockState(basePos)
            ) === 'farmersrespite:small_tea_bush'
        }

        else if (kind === 'grape') {
          succeeded = after.isAir()
        }

        else if (kind === 'fr_coffee') {
          succeeded =
            blockId(after) === id &&
            (
              (coffeeAgeBefore === '2' && propertyValue(after, 'age') === '0') ||
              (coffeeAge1Before === '2' && propertyValue(after, 'age1') === '0')
            )
        }
        else if (kind === 'kc_chili') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '5'
        }
        else if (kind === 'vanilla_sweet_berry') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '1'
        }
        else if (kind === 'bwg_blueberry') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '1'
        }
        else if (kind === 'fdl_cranberry') {
          succeeded =
            blockId(after) === id &&
            propertyValue(after, 'age') === '2'
        }

        // 수확이 실제로 완료됐을 때만 지급.
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
