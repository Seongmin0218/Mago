ServerEvents.recipes(event => {
    const symmetryRune =
        'iss_magicfromtheeast:symmetry_rune'

    const spiritRune =
        'iss_magicfromtheeast:spirit_rune'

    const symmetryUpgradeOrb =
        'iss_magicfromtheeast:symmetry_upgrade_orb'

    const symmetryStaff =
        'somakespells:symmetry_staff'


    // =========================================================
    // Symmetry Rune -> Spirit Rune
    // =========================================================

    /*
     * Surviving recipes that previously required Symmetry Rune
     * should use Spirit Rune instead.
     */
    event.replaceInput(
        {},
        symmetryRune,
        spiritRune
    )


    // =========================================================
    // Retired item recipes
    // =========================================================

    /*
     * Use output filtering instead of assuming that recipe ID
     * is identical to item ID.
     */
    event.remove({
        output: symmetryRune
    })

    event.remove({
        output: symmetryUpgradeOrb
    })

    event.remove({
        output: symmetryStaff
    })


    // =========================================================
    // Remove leftover recipes referencing retired ingredients
    // =========================================================

    /*
     * Standard surviving recipes were already migrated above.
     *
     * If any recipe still refers to the retired Rune or Orb,
     * remove that recipe completely so JEI cannot expose the
     * retired ingredients through another item's recipe view.
     */
    event.remove({
        input: symmetryRune
    })

    event.remove({
        input: symmetryUpgradeOrb
    })

        // =========================================================
    // Shadow -> Abyssal progression migration
    // =========================================================

    const shadowRune =
        'hazentouvelib:shadow_rune'

    const abyssalRune =
        'cataclysm_spellbooks:abyssal_rune'

    const shadowUpgradeOrb =
        'hazentouvelib:shadow_upgrade_orb'


    /*
     * Preserve recipes which previously consumed Shadow Rune.
     *
     * Shadow school is consolidated into Abyssal in Mago,
     * so surviving recipes now consume Abyssal Rune.
     */
    event.replaceInput(
        {},
        shadowRune,
        abyssalRune
    )


    /*
     * Retire the Shadow progression items themselves.
     */
    event.remove({
        output: shadowRune
    })

    event.remove({
        output: shadowUpgradeOrb
    })

        // =========================================================
    // Blood -> Occult progression migration
    // =========================================================

    const bloodRune =
        'irons_spellbooks:blood_rune'

    const bloodyVellum =
        'irons_spellbooks:bloody_vellum'

    const bloodUpgradeOrb =
        'irons_spellbooks:blood_upgrade_orb'

    const bloodVial =
        'irons_spellbooks:blood_vial'


    /*
     * Blood school progression is retired in Mago.
     *
     * Surviving recipes which previously consumed Blood Rune
     * now consume Blood Vial instead.
     */
    event.replaceInput(
        {},
        bloodRune,
        bloodVial
    )


    /*
     * Bloody Vellum is also retired.
     *
     * Preserve recipes such as the Vampiric Spell Book and
     * Greater Conjurer's Talisman by using Blood Vial.
     */
    event.replaceInput(
        {},
        bloodyVellum,
        bloodVial
    )


    // =========================================================
    // Retired Blood progression recipes
    // =========================================================

    event.remove({
        output: bloodRune
    })

    event.remove({
        output: bloodUpgradeOrb
    })


    /*
     * Bloody Vellum is produced as a byproduct by a custom
     * Alchemist Cauldron recipe, so remove its exact recipe ID.
     */
    event.remove({
        id: 'irons_spellbooks:alchemist_cauldron/soak_bloody_vellum'
    })

        // =========================================================
    // Somake Aqua -> Hydro progression migration
    // =========================================================

    const aquaRune =
        'somakespells:aqua_rune'

    const aquaUpgradeOrb =
        'somakespells:aqua_upgrade_orb'

    const hydroRune =
        'hazennstuff:hydro_rune'

    const hydroUpgradeOrb =
        'hazennstuff:hydro_upgrade_orb'


    // Preserve recipes which previously consumed Aqua Rune.
    event.replaceInput(
        {},
        aquaRune,
        hydroRune
    )


    // Preserve ordinary recipes which consumed the Aqua Upgrade Orb.
    event.replaceInput(
        {},
        aquaUpgradeOrb,
        hydroUpgradeOrb
    )


    // Retire Somake's old Aqua progression.
    event.remove({
        output: aquaRune
    })

    event.remove({
        output: aquaUpgradeOrb
    })

        // =========================================================
    // Legendary Spellbooks - Annihilation retirement
    // =========================================================

    const annihilatorsProtocol =
        'legendary_spellbooks:annihilators_protocol'

    const annihilationRune =
        'legendary_spellbooks:annihilation_rune'

    const annihilationUpgradeOrb =
        'legendary_spellbooks:upgrade_orb_annihilation'

    const oblivionmancerHat =
        'legendary_spellbooks:oblivionmancer_hat'

    const oblivionmancerRobe =
        'legendary_spellbooks:oblivionmancer_robe'

    const oblivionmancerLeggings =
        'legendary_spellbooks:oblivionmancer_leggings'

    const oblivionmancerBoots =
        'legendary_spellbooks:oblivionmancer_boots'

    const rodOfDiscord =
        'hazennstuff:rod_of_discord'


    // ---------------------------------------------------------
    // Remove direct crafting outputs
    // ---------------------------------------------------------

    event.remove({
        output: annihilationRune
    })

    event.remove({
        output: annihilationUpgradeOrb
    })

    event.remove({
        output: oblivionmancerHat
    })

    event.remove({
        output: oblivionmancerRobe
    })

    event.remove({
        output: oblivionmancerLeggings
    })

    event.remove({
        output: oblivionmancerBoots
    })

    event.remove({
        output: annihilatorsProtocol
    })

    event.remove({
        output: rodOfDiscord
    })


    /*
     * Annihilation Rune has no surviving purpose in Mago.
     *
     * This also cleans up any addon recipe which might still
     * consume the retired rune.
     */
    event.remove({
        input: annihilationRune
    })


    /*
     * Same safety cleanup for the retired Upgrade Orb.
     */
    event.remove({
        input: annihilationUpgradeOrb
    })

        // =========================================================
    // Artifacts - everlasting food retirement
    // =========================================================

    const everlastingBeef =
        'artifacts:everlasting_beef'

    const eternalSteak =
        'artifacts:eternal_steak'


    // Remove every cooking route to Eternal Steak.
    event.remove({
        output: eternalSteak
    })


    // Safety cleanup in case another mod adds recipes
    // consuming the retired everlasting foods.
    event.remove({
        input: everlastingBeef
    })

    event.remove({
        input: eternalSteak
    })
})