const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readJsonFile, writeJsonFile } = require('../utils/github');
const { isAuthorized } = require('../utils/permissions');

const PATH = 'data/pokemon.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pokemon')
    .setDescription('Gérer le catalogue de la Pension Pokémon')
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Ajouter un Pokémon à la Pension')
      .addStringOption(o => o.setName('nom').setDescription('Nom du Pokémon').setRequired(true))
      .addStringOption(o => o.setName('type1').setDescription('Type principal').setRequired(true))
      .addIntegerOption(o => o.setName('niveau').setDescription('Niveau').setRequired(true))
      .addIntegerOption(o => o.setName('prix').setDescription('Prix en $').setRequired(true))
      .addStringOption(o => o.setName('type2').setDescription('Type secondaire (optionnel)').setRequired(false))
      .addStringOption(o => o.setName('nature').setDescription('Nature').setRequired(false))
      .addStringOption(o => o.setName('talent').setDescription('Talent').setRequired(false))
      .addStringOption(o => o.setName('iv').setDescription('IV format PV/Att/Déf/AtSp/DéfSp/Vit').setRequired(false))
      .addBooleanOption(o => o.setName('shiny').setDescription('Shiny ?').setRequired(false))
      .addBooleanOption(o => o.setName('legendaire').setDescription('Légendaire ?').setRequired(false))
      .addBooleanOption(o => o.setName('tc').setDescription('Talent Caché ?').setRequired(false))
    )
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription('Retirer un Pokémon de la Pension')
      .addStringOption(o => o.setName('nom').setDescription('Nom exact du Pokémon à retirer').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('disponibilite')
      .setDescription("Changer la disponibilité d'un Pokémon")
      .addStringOption(o => o.setName('nom').setDescription('Nom exact du Pokémon').setRequired(true))
      .addStringOption(o => o.setName('statut').setDescription('Nouveau statut')
        .setRequired(true)
        .addChoices(
          { name: 'Disponible', value: 'Disponible' },
          { name: 'Réservé', value: 'Réservé' },
          { name: 'Vendu', value: 'Vendu' },
        ))
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('Voir les 10 dernières fiches ajoutées')
    ),

  async execute(interaction) {
    if (!isAuthorized(interaction)) {
      return interaction.reply({ content: "⛔ Tu n'as pas la permission d'utiliser cette commande.", ephemeral: true });
    }
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const { data: mons, sha } = await readJsonFile(PATH);

    if (sub === 'add') {
      const nom = interaction.options.getString('nom');
      const type1 = interaction.options.getString('type1');
      const type2 = interaction.options.getString('type2');
      const niveau = interaction.options.getInteger('niveau');
      const prix = interaction.options.getInteger('prix');
      const nature = interaction.options.getString('nature') || 'Calme';
      const talent = interaction.options.getString('talent') || 'Ténacité';
      const ivDisplay = interaction.options.getString('iv') || '31/31/31/31/31/31';
      const shiny = interaction.options.getBoolean('shiny') || false;
      const legendary = interaction.options.getBoolean('legendaire') || false;
      const tc = interaction.options.getBoolean('tc') || false;

      const newMon = {
        id: mons.length ? Math.max(...mons.map(m => m.id)) + 1 : 0,
        name: nom,
        types: type2 ? [type1, type2] : [type1],
        level: niveau,
        sex: '—',
        nature,
        talent,
        tc,
        sprite: null,
        iv: ivDisplay.split('/').reduce((a, b) => a + parseInt(b, 10), 0),
        ivDisplay,
        ev: '252/252/4',
        shiny,
        legendary,
        price: prix,
        avail: 'Disponible',
      };
      mons.push(newMon);
      await writeJsonFile(PATH, mons, sha, `Ajout de ${nom} via le bot Discord (par ${interaction.user.tag})`);

      const embed = new EmbedBuilder()
        .setTitle(`✅ ${nom} ajouté à la Pension`)
        .setColor(0x3F7FA6)
        .addFields(
          { name: 'Types', value: newMon.types.join(' / '), inline: true },
          { name: 'Niveau', value: `${niveau}`, inline: true },
          { name: 'Prix', value: `${prix}$`, inline: true },
        );
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      const nom = interaction.options.getString('nom');
      const idx = mons.findIndex(m => m.name.toLowerCase() === nom.toLowerCase());
      if (idx === -1) return interaction.editReply(`❌ Aucun Pokémon nommé "${nom}" trouvé.`);
      mons.splice(idx, 1);
      await writeJsonFile(PATH, mons, sha, `Suppression de ${nom} via le bot Discord (par ${interaction.user.tag})`);
      return interaction.editReply(`🗑️ ${nom} retiré de la Pension.`);
    }

    if (sub === 'disponibilite') {
      const nom = interaction.options.getString('nom');
      const statut = interaction.options.getString('statut');
      const mon = mons.find(m => m.name.toLowerCase() === nom.toLowerCase());
      if (!mon) return interaction.editReply(`❌ Aucun Pokémon nommé "${nom}" trouvé.`);
      mon.avail = statut;
      await writeJsonFile(PATH, mons, sha, `${nom} → ${statut} via le bot Discord (par ${interaction.user.tag})`);
      return interaction.editReply(`✅ ${nom} est maintenant "${statut}".`);
    }

    if (sub === 'list') {
      const last10 = mons.slice(-10).reverse();
      const embed = new EmbedBuilder()
        .setTitle('📋 Dernières fiches de la Pension')
        .setColor(0x1E4C6D)
        .setDescription(last10.map(m => `**${m.name}** — Nv.${m.level} — ${m.price}$ — ${m.avail}`).join('\n') || 'Pension vide.');
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
