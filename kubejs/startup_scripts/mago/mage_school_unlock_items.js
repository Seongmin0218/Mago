// Mago - Mage Basic School Unlock System v2
//
// KubeJS 1.21:
// - global 값 설정은 startup_scripts에서만 한다.
// - 개방권 아이템 자체에 .use(...)를 연결해 우클릭 동작을 보장한다.
// - 추후 NPC에서도 global.MagoMageSchools.unlock(player, 'hydro') 재사용 가능.

(function () {
  const $Component = Java.loadClass('net.minecraft.network.chat.Component')

  const ACTIVE_TAG = 'mago_mage_active'

  const SCHOOLS = [
    {
      id: 'fire',
      name: '화염',
      tag: 'mago_magic_school_fire',
      primaryTag: 'mago_magic_primary_fire',
      extraTag: 'mago_magic_extra_fire',
      ticket: 'kubejs:mage_school_unlock_fire'
    },
    {
      id: 'hydro',
      name: 'Hydro',
      tag: 'mago_magic_school_hydro',
      primaryTag: 'mago_magic_primary_hydro',
      extraTag: 'mago_magic_extra_hydro',
      ticket: 'kubejs:mage_school_unlock_hydro'
    },
    {
      id: 'nature',
      name: '자연',
      tag: 'mago_magic_school_nature',
      primaryTag: 'mago_magic_primary_nature',
      extraTag: 'mago_magic_extra_nature',
      ticket: 'kubejs:mage_school_unlock_nature'
    },
    {
      id: 'geo',
      name: 'Geo',
      tag: 'mago_magic_school_geo',
      primaryTag: 'mago_magic_primary_geo',
      extraTag: 'mago_magic_extra_geo',
      ticket: 'kubejs:mage_school_unlock_geo'
    },
    {
      id: 'lightning',
      name: '번개',
      tag: 'mago_magic_school_lightning',
      primaryTag: 'mago_magic_primary_lightning',
      extraTag: 'mago_magic_extra_lightning',
      ticket: 'kubejs:mage_school_unlock_lightning'
    },
    {
      id: 'ice',
      name: '얼음',
      tag: 'mago_magic_school_ice',
      primaryTag: 'mago_magic_primary_ice',
      extraTag: 'mago_magic_extra_ice',
      ticket: 'kubejs:mage_school_unlock_ice'
    },
    {
      id: 'ender',
      name: '엔더',
      tag: 'mago_magic_school_ender',
      primaryTag: 'mago_magic_primary_ender',
      extraTag: 'mago_magic_extra_ender',
      ticket: 'kubejs:mage_school_unlock_ender'
    },
    {
      id: 'holy',
      name: '신성',
      tag: 'mago_magic_school_holy',
      primaryTag: 'mago_magic_primary_holy',
      extraTag: 'mago_magic_extra_holy',
      ticket: 'kubejs:mage_school_unlock_holy'
    },
    {
      id: 'summon',
      name: '소환',
      tag: 'mago_magic_school_summon',
      primaryTag: 'mago_magic_primary_summon',
      extraTag: 'mago_magic_extra_summon',
      ticket: 'kubejs:mage_school_unlock_summon'
    },
    {
      id: 'melody',
      name: '멜로디',
      tag: 'mago_magic_school_melody',
      primaryTag: 'mago_magic_primary_melody',
      extraTag: 'mago_magic_extra_melody',
      ticket: 'kubejs:mage_school_unlock_melody'
    },
    {
      id: 'wind',
      name: '바람',
      tag: 'mago_magic_school_wind',
      primaryTag: 'mago_magic_primary_wind',
      extraTag: 'mago_magic_extra_wind',
      ticket: 'kubejs:mage_school_unlock_wind'
    }
  ]

  const SCHOOL_BY_ID = {}
  SCHOOLS.forEach(school => {
    SCHOOL_BY_ID[school.id] = school
  })


  function hasTag(player, tag) {
    return player != null && player.getTags().contains(tag)
  }


  function actionBar(player, message) {
    player.displayClientMessage(
      $Component.literal(message),
      true
    )
  }


  function chat(player, message) {
    player.tell(
      $Component.literal(message)
    )
  }


  function getSchoolCount(player) {
    let count = 0

    SCHOOLS.forEach(school => {
      if (hasTag(player, school.tag)) {
        count++
      }
    })

    return count
  }


  function hasPrimarySchool(player) {
    for (let i = 0; i < SCHOOLS.length; i++) {
      if (hasTag(player, SCHOOLS[i].primaryTag)) {
        return true
      }
    }

    return false
  }


  function hasRareOrHigher(player) {
    return (
      hasTag(player, 'mago_mage_tier_rare') ||
      hasTag(player, 'mago_mage_tier_epic') ||
      hasTag(player, 'mago_mage_tier_legendary')
    )
  }


  function hasLegendary(player) {
    return hasTag(
      player,
      'mago_mage_tier_legendary'
    )
  }


  function clearBasicSchoolPermissions(player) {
    SCHOOLS.forEach(school => {
      player.removeTag(school.tag)
      player.removeTag(school.primaryTag)
      player.removeTag(school.extraTag)
    })
  }


  function unlockSchool(player, schoolId) {
    if (player == null) {
      return false
    }

    const school =
      SCHOOL_BY_ID[String(schoolId)]

    if (school == null) {
      actionBar(
        player,
        '존재하지 않는 기본 학파입니다.'
      )
      return false
    }


    if (!hasTag(player, ACTIVE_TAG)) {
      actionBar(
        player,
        '현재 마법사 전문화가 활성화되어 있지 않습니다.'
      )
      return false
    }


    if (!hasPrimarySchool(player)) {
      actionBar(
        player,
        '먼저 마법사 스킬트리에서 최초 학파를 선택해야 합니다.'
      )
      return false
    }


    if (hasTag(player, school.tag)) {
      actionBar(
        player,
        '이미 선택된 학파입니다: ' + school.name + ' 학파'
      )
      return false
    }


    const currentCount =
      getSchoolCount(player)


    if (currentCount <= 0) {
      actionBar(
        player,
        '먼저 마법사 스킬트리에서 최초 학파를 선택해야 합니다.'
      )
      return false
    }


    if (currentCount >= 3) {
      actionBar(
        player,
        '기본 학파는 최대 3개까지 개방할 수 있습니다.'
      )
      return false
    }


    // 제2학파
    if (
      currentCount === 1 &&
      !hasRareOrHigher(player)
    ) {
      actionBar(
        player,
        '제2학파를 개방하려면 희귀 등급에 도달해야 합니다.'
      )
      return false
    }


    // 제3학파
    if (
      currentCount === 2 &&
      !hasLegendary(player)
    ) {
      actionBar(
        player,
        '제3학파를 개방하려면 전설 등급에 도달해야 합니다.'
      )
      return false
    }


    player.addTag(school.tag)
    player.addTag(school.extraTag)

    actionBar(
      player,
      school.name + ' 학파를 개방했습니다.'
    )

    chat(
      player,
      '현재 기본 학파: ' + (currentCount + 1) + ' / 3'
    )

    return true
  }


  // KubeJS 1.21에서는 global SET을 startup_scripts에서만 수행한다.
  global.MagoMageSchools = {
    unlock: unlockSchool,
    count: getSchoolCount,
    hasPrimary: hasPrimarySchool,
    clear: clearBasicSchoolPermissions
  }


  // ------------------------------------------------------------
  // 개방권 아이템 등록
  // ------------------------------------------------------------

  StartupEvents.registry('item', event => {
    SCHOOLS.forEach(school => {

      event.create(school.ticket)
        .displayName(school.name + ' 학파 개방권')
        .maxStackSize(16)
        .rarity('rare')
        .glow(true)
        .texture('minecraft:item/paper')
        .tooltip('§7마법사의 추가 기본 학파를 개방합니다.')
        .tooltip('§7희귀 등급에서 제2학파, 전설 등급에서 제3학파를 개방할 수 있습니다.')
        .tooltip('§8이미 보유한 학파에는 사용할 수 없습니다.')
        .tooltip('§8개방 성공 시 개방권 1개를 소모합니다.')

        // ItemEvents.rightClicked 대신 아이템 자체의 use().
        .use((level, player, hand) => {

          // 서버에서만 실제 판정/태그 변경/아이템 소모.
          if (level.isClientSide()) {
            return true
          }

          const success =
            global.MagoMageSchools.unlock(
              player,
              school.id
            )

          if (success) {
            player.getItemInHand(hand).shrink(1)
          }

          return true
        })
    })
  })
})()
