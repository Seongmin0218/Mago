// kubejs/server_scripts/mago_mining_block_dump.js
//
// 명령어:
//   /mago_dump_mining_blocks
//
// 목적:
// - 현재 모드팩에 등록된 채광 관련 블록 전수 조사
// - 모드 돌 / 광석 / 곡괭이 채굴 가능 블록 파악
// - Puffish Skills 채광 experience.json 설계용
//
// 로그 검색 키워드:
//   MAGO_MINING_BLOCK_DUMP
//
// 출력:
// BLOCK
// |id=...
// |namespace=...
// |path=...
// |category=ORE / BASE_STONE / PICKAXE / HEURISTIC
// |destroy_speed=...
// |requires_correct_tool=...
// |tags=...
//
// SUMMARY
// |registry_total=...
// |dumped=...
// |ores=...
// |base_stones=...
// |pickaxe_only=...
// |heuristic=...
// |errors=...


var $MagoMiningBuiltInRegistries = Java.loadClass(
  'net.minecraft.core.registries.BuiltInRegistries'
)

var $MagoMiningComponent = Java.loadClass(
  'net.minecraft.network.chat.Component'
)

var $MagoMiningBlockPos = Java.loadClass(
  'net.minecraft.core.BlockPos'
)


function magoMiningLog(message) {
  console.info(
    '[MAGO_MINING_BLOCK_DUMP] ' + message
  )
}


function magoMiningSafeNumber(value) {
  try {
    if (value === null || value === undefined) {
      return 'N/A'
    }

    return String(value)
  } catch (error) {
    return 'N/A'
  }
}


function magoMiningGetTags(
  registry,
  block,
  id
) {
  var result = []

  try {
    // ResourceKey -> getHolder() 사용 금지
    // Rhino 오버로드 변환 문제 회피를 위해
    // 실제 Block 값으로 Holder를 직접 가져온다.
    var holder =
      registry.wrapAsHolder(block)

    if (
      holder === null ||
      holder === undefined
    ) {
      magoMiningLog(
        'TAG_ERROR' +
        '|id=' + id +
        '|reason=holder_null'
      )

      return result
    }


    var iterator =
      holder
        .tags()
        .iterator()


    while (
      iterator.hasNext()
    ) {
      var tag =
        iterator.next()

      try {
        result.push(
          String(
            tag.location()
          )
        )
      } catch (locationError) {
        result.push(
          String(tag)
        )
      }
    }

  } catch (error) {
    // v1에서는 이 오류를 조용히 삼켜서
    // tags= 빈 값만 나왔다.
    // v2에서는 반드시 로그에 출력한다.
    magoMiningLog(
      'TAG_ERROR' +
      '|id=' + id +
      '|error=' +
      String(error)
    )
  }


  result.sort()

  return result
}


function magoMiningHasTag(
  tags,
  target
) {
  for (
    var i = 0;
    i < tags.length;
    i++
  ) {
    if (
      tags[i] === target
    ) {
      return true
    }
  }

  return false
}


function magoMiningHasOreTag(tags) {
  for (
    var i = 0;
    i < tags.length;
    i++
  ) {
    var tag =
      String(tags[i])

    var colon =
      tag.indexOf(':')

    var path =
      colon >= 0
        ? tag.substring(colon + 1)
        : tag


    // NeoForge/Common Tags
    //
    // c:ores
    // c:ores/iron
    // c:ores/diamond
    //
    if (
      tag === 'c:ores'
    ) {
      return true
    }

    if (
      path.indexOf('ores/') === 0
    ) {
      return true
    }

    if (
      path === 'ores'
    ) {
      return true
    }


    // 구 Forge 태그를 사용하는 모드까지 포착
    if (
      tag === 'forge:ores'
    ) {
      return true
    }

    if (
      tag.indexOf(
        'forge:ores/'
      ) === 0
    ) {
      return true
    }
  }

  return false
}


function magoMiningLooksLikeMiningBlock(
  id,
  tags
) {
  var text =
    String(id).toLowerCase()

  var colon =
    text.indexOf(':')

  var path =
    colon >= 0
      ? text.substring(colon + 1)
      : text


  // ID 자체가 광석임을 나타내는 경우
  if (
    path.indexOf('_ore') >= 0 ||
    path.indexOf('ore_') >= 0 ||
    path === 'ore'
  ) {
    return true
  }


  // 자연 암석 계열을 놓치지 않기 위한 보조 탐지
  var keywords = [
    'stone',
    'deepslate',
    'granite',
    'diorite',
    'andesite',
    'tuff',
    'calcite',

    'rock',
    'slate',
    'shale',
    'limestone',
    'marble',
    'basalt',
    'gneiss',
    'schist',

    'netherrack',
    'blackstone',
    'end_stone'
  ]


  for (
    var i = 0;
    i < keywords.length;
    i++
  ) {
    if (
      path.indexOf(
        keywords[i]
      ) >= 0
    ) {
      return true
    }
  }


  // 태그 이름에도 stone/rock/ore 등이 있는지 확인
  for (
    var j = 0;
    j < tags.length;
    j++
  ) {
    var tagText =
      String(tags[j]).toLowerCase()

    if (
      tagText.indexOf('ore') >= 0 ||
      tagText.indexOf('stone') >= 0 ||
      tagText.indexOf('rock') >= 0
    ) {
      return true
    }
  }


  return false
}


function magoMiningClassify(
  id,
  tags
) {
  var isOre =
    magoMiningHasOreTag(tags)

  if (isOre) {
    return 'ORE'
  }


  var isBaseStone =
    magoMiningHasTag(
      tags,
      'minecraft:base_stone_overworld'
    ) ||
    magoMiningHasTag(
      tags,
      'minecraft:base_stone_nether'
    )

  if (isBaseStone) {
    return 'BASE_STONE'
  }


  var isPickaxe =
    magoMiningHasTag(
      tags,
      'minecraft:mineable/pickaxe'
    )

  if (isPickaxe) {
    return 'PICKAXE'
  }


  if (
    magoMiningLooksLikeMiningBlock(
      id,
      tags
    )
  ) {
    return 'HEURISTIC'
  }


  return null
}


function magoDumpMiningBlocks(ctx) {
  var registry =
    $MagoMiningBuiltInRegistries.BLOCK

  var registryTotal = 0
  var dumped = 0

  var oreCount = 0
  var baseStoneCount = 0
  var pickaxeCount = 0
  var heuristicCount = 0

  var errorCount = 0

  var output = []


  try {
    var iterator =
      registry
        .entrySet()
        .iterator()


    while (iterator.hasNext()) {
      registryTotal++

      try {
        var entry =
          iterator.next()

        var resourceKey =
          entry.getKey()

        var block =
          entry.getValue()

        var id =
          String(
            resourceKey.location()
          )

        var colon =
          id.indexOf(':')

        var namespace =
          colon >= 0
            ? id.substring(
                0,
                colon
              )
            : 'unknown'

        var path =
          colon >= 0
            ? id.substring(
                colon + 1
              )
            : id


        var tags =
        magoMiningGetTags(
            registry,
            block,
            id
        )


        var category =
          magoMiningClassify(
            id,
            tags
          )


        // 광석 / 암석 / 곡괭이 채굴 / 이름 기반 후보가
        // 아니면 출력하지 않음
        if (
          category === null
        ) {
          continue
        }


        var defaultState =
          block.defaultBlockState()


        var destroySpeed =
          'N/A'

        try {
          destroySpeed =
            magoMiningSafeNumber(
              defaultState.getDestroySpeed(
                ctx.source.getLevel(),
                $MagoMiningBlockPos.ZERO
              )
            )
        } catch (speedError) {
          destroySpeed =
            'ERROR'
        }


        var requiresCorrectTool =
          'N/A'

        try {
          requiresCorrectTool =
            String(
              defaultState
                .requiresCorrectToolForDrops()
            )
        } catch (toolError) {
          requiresCorrectTool =
            'ERROR'
        }


        if (
          category === 'ORE'
        ) {
          oreCount++
        } else if (
          category === 'BASE_STONE'
        ) {
          baseStoneCount++
        } else if (
          category === 'PICKAXE'
        ) {
          pickaxeCount++
        } else if (
          category === 'HEURISTIC'
        ) {
          heuristicCount++
        }


        dumped++


        output.push({
          id: id,
          namespace: namespace,
          path: path,
          category: category,
          destroySpeed:
            destroySpeed,
          requiresCorrectTool:
            requiresCorrectTool,
          tags: tags
        })

      } catch (blockError) {
        errorCount++

        magoMiningLog(
          'BLOCK_ERROR' +
          '|error=' +
          String(blockError)
        )
      }
    }


    // ID 기준 정렬
    output.sort(
      function(a, b) {
        if (a.id < b.id) {
          return -1
        }

        if (a.id > b.id) {
          return 1
        }

        return 0
      }
    )


    magoMiningLog(
      '============================================================'
    )

    magoMiningLog(
      'BEGIN' +
      '|version=2' +
      '|registry_total=' +
      registryTotal
    )

    magoMiningLog(
      '============================================================'
    )


    for (
      var i = 0;
      i < output.length;
      i++
    ) {
      var data =
        output[i]


      magoMiningLog(
        'BLOCK' +
        '|id=' +
          data.id +
        '|namespace=' +
          data.namespace +
        '|path=' +
          data.path +
        '|category=' +
          data.category +
        '|destroy_speed=' +
          data.destroySpeed +
        '|requires_correct_tool=' +
          data.requiresCorrectTool +
        '|tags=' +
          data.tags.join(';')
      )
    }


    magoMiningLog(
      '------------------------------------------------------------'
    )


    magoMiningLog(
      'SUMMARY' +
      '|registry_total=' +
        registryTotal +
      '|dumped=' +
        dumped +
      '|ores=' +
        oreCount +
      '|base_stones=' +
        baseStoneCount +
      '|pickaxe_only=' +
        pickaxeCount +
      '|heuristic=' +
        heuristicCount +
      '|errors=' +
        errorCount
    )


    magoMiningLog(
      '============================================================'
    )

    magoMiningLog('END')

    magoMiningLog(
      '============================================================'
    )


    ctx.source.sendSuccess(
      function() {
        return $MagoMiningComponent.literal(
          '[Mago] 채광 블록 덤프 완료. latest.log에서 MAGO_MINING_BLOCK_DUMP 검색.'
        )
      },
      false
    )


    return 1

  } catch (error) {
    console.error(
      '[MAGO_MINING_BLOCK_DUMP] FATAL_ERROR: ' +
      String(error)
    )


    ctx.source.sendFailure(
      $MagoMiningComponent.literal(
        '[Mago] 채광 블록 덤프 실패. latest.log 확인.'
      )
    )


    return 0
  }
}


ServerEvents.commandRegistry(
  function(event) {
    event.register(
      event.commands
        .literal(
          'mago_dump_mining_blocks'
        )

        .requires(
          function(source) {
            return source.hasPermission(2)
          }
        )

        .executes(
          function(ctx) {
            return magoDumpMiningBlocks(
              ctx
            )
          }
        )
    )
  }
)