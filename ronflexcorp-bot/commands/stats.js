const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readJsonFile, writeJsonFile } = require('../utils/github');
const { isAuthorized } = require('../utils/permissions');

const PATH = 'data/stats.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Gérer les statistiques du Hero (Membres, Pokémon dispo., etc.)')
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription("Définir la valeur d'une statistique existante")
      .addStringOption(o => o.setName('label').setDescription('Label exact, ex. "Membres"').setRequired(true))
      .addIntegerOption(o => o.setName('valeur').setDescription('Nouvelle valeur').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Ajouter une nouvelle statistique')
      .addStringOption(o => o.setName('label').setDescription('Label affiché').setRequired(true))
      .addIntegerOption(o => o.setName('valeur').setDescription('Valeur de départ').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('Voir toutes les statistiques actuelles')
    ),

  async execute(interaction) {
    if (!isAuthorized(interaction)) {
      return interaction.reply({ content: "⛔ Tu n'as pas la permission d'utiliser cette commande.", ephemeral: true });
    }
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const { data: stats, sha } = await readJsonFile(PATH);

    if (sub === 'set') {
      const label = interaction.options.getString('label');
      const valeur = interaction.options.getInteger('valeur');
      const stat = stats.find(s => s.label.toLowerCase() === label.toLowerCase());
      if (!stat) return interaction.editReply(`❌ Aucune statistique "${label}" trouvée. Utilise /stats list pour voir les labels exacts.`);
      stat.value = valeur;
      await writeJsonFile(PATH, stats, sha, `${label} → ${valeur} via le bot Discord (par ${interaction.user.tag})`);
      return interaction.editReply(`✅ **${label}** mis à jour : ${valeur}`);
    }

    if (sub === 'add') {
      const label = interaction.options.getString('label');
      const valeur = interaction.options.getInteger('valeur');
      stats.push({ label, value: valeur });
      await writeJsonFile(PATH, stats, sha, `Ajout de la statistique ${label} via le bot Discord (par ${interaction.user.tag})`);
      return interaction.editReply(`✅ Statistique **${label}** ajoutée avec la valeur ${valeur}.`);
    }

    if (sub === 'list') {
      const embed = new EmbedBuilder()
        .setTitle('📊 Statistiques actuelles')
        .setColor(0x1E4C6D)
        .setDescription(stats.map(s => `**${s.label}** : ${s.value}`).join('\n'));
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
