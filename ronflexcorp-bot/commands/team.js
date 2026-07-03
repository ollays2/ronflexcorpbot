const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readJsonFile, writeJsonFile } = require('../utils/github');
const { isAuthorized } = require('../utils/permissions');

const PATH = 'data/team.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription("Gérer l'équipe affichée sur le site (section Contact)")
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription("Ajouter un membre de l'équipe")
      .addStringOption(o => o.setName('nom').setDescription('Pseudo').setRequired(true))
      .addStringOption(o => o.setName('role').setDescription('Rôle (ex. Fondateur)').setRequired(true))
      .addStringOption(o => o.setName('initiales').setDescription('2 lettres pour l\'avatar').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription("Retirer un membre de l'équipe")
      .addStringOption(o => o.setName('nom').setDescription('Pseudo exact').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription("Voir l'équipe actuelle")
    ),

  async execute(interaction) {
    if (!isAuthorized(interaction)) {
      return interaction.reply({ content: "⛔ Tu n'as pas la permission d'utiliser cette commande.", ephemeral: true });
    }
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const { data: team, sha } = await readJsonFile(PATH);

    if (sub === 'add') {
      const nom = interaction.options.getString('nom');
      const role = interaction.options.getString('role');
      const initiales = interaction.options.getString('initiales').toUpperCase().slice(0, 2);
      team.push({ initiales, nom, role });
      await writeJsonFile(PATH, team, sha, `Ajout de ${nom} à l'équipe via le bot Discord (par ${interaction.user.tag})`);
      return interaction.editReply(`✅ **${nom}** (${role}) ajouté à l'équipe.`);
    }

    if (sub === 'remove') {
      const nom = interaction.options.getString('nom');
      const idx = team.findIndex(m => m.nom.toLowerCase() === nom.toLowerCase());
      if (idx === -1) return interaction.editReply(`❌ Aucun membre nommé "${nom}" trouvé.`);
      team.splice(idx, 1);
      await writeJsonFile(PATH, team, sha, `Retrait de ${nom} de l'équipe via le bot Discord (par ${interaction.user.tag})`);
      return interaction.editReply(`🗑️ ${nom} retiré de l'équipe.`);
    }

    if (sub === 'list') {
      const embed = new EmbedBuilder()
        .setTitle("👥 Équipe actuelle")
        .setColor(0x1E4C6D)
        .setDescription(team.map(m => `**${m.nom}** — ${m.role}`).join('\n') || 'Aucun membre.');
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
