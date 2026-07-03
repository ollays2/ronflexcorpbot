const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Ordre du haut vers le bas de la hiérarchie Discord.
// hoist:true = affiché séparément dans la liste des membres (utilisé pour direction + grades RP)
const ROLES = [
  { name: '👑 Fondateur du Sommeil',   color: '#C9A66B', hoist: true },
  { name: '🛡️ Co-Gardien Suprême',     color: '#3F7FA6', hoist: true },
  { name: '💤 Maître de la Pension',   color: '#6FA0C2', hoist: true },
  { name: '⚙️ Veilleur',               color: '#8C97A6', hoist: true },
  { name: '⭐ Titan Assoupi',          color: '#C9A66B', hoist: true },
  { name: '🛡️ Gardien du Territoire',  color: '#3F7FA6', hoist: true },
  { name: '🌿 Somnambule',             color: '#5C9A5C', hoist: true },
  { name: '💤 Ronfleur',               color: '#F2E8D5', hoist: true },
  { name: '🌃 Insomniaque',            color: '#5C5A82', hoist: false },
  { name: '🍖 Ventre Affamé',          color: '#B5473A', hoist: false },
  { name: '✨ Chasseur de Shiny',      color: '#D9B33C', hoist: false },
  { name: '🌸 Ami de la Forêt',        color: '#D98FB3', hoist: false },
  { name: '📢 Ronfleur Bruyant',       color: '#3F7FA6', hoist: false },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-roles')
    .setDescription('Crée automatiquement tous les rôles RonflexCorp (direction, grades RP, cosmétiques)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '⛔ Réservé aux administrateurs du serveur.', ephemeral: true });
    }
    await interaction.deferReply();

    const guild = interaction.guild;
    const botMember = await guild.members.fetchMe();

    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.editReply(
        "❌ Je n'ai pas la permission \"Gérer les rôles\". Donne-moi cette permission (Réglages du serveur → Rôles → mon rôle bot) puis réessaie."
      );
    }

    const created = [];
    const skipped = [];
    const createdRoleObjects = [];

    for (const roleDef of ROLES) {
      const existing = guild.roles.cache.find(r => r.name === roleDef.name);
      if (existing) {
        skipped.push(roleDef.name);
        createdRoleObjects.push(existing);
        continue;
      }
      try {
        const role = await guild.roles.create({
          name: roleDef.name,
          color: roleDef.color,
          hoist: roleDef.hoist,
          mentionable: false,
          reason: `Créé via /setup-roles par ${interaction.user.tag}`,
        });
        created.push(roleDef.name);
        createdRoleObjects.push(role);
      } catch (err) {
        console.error(`Erreur création rôle ${roleDef.name}:`, err.message);
      }
    }

    // Réordonne les rôles créés/existants dans l'ordre défini ci-dessus.
    // Le rôle du bot doit être positionné au-dessus de tous ces rôles dans Discord,
    // sinon Discord refuse de les réordonner (limite de sécurité de l'API).
    try {
      const botHighestPosition = botMember.roles.highest.position;
      const positions = createdRoleObjects
        .filter(r => r.position < botHighestPosition)
        .map((role, index) => ({
          role: role.id,
          position: Math.max(1, botHighestPosition - 1 - index),
        }));
      if (positions.length > 0) {
        await guild.roles.setPositions(positions);
      }
    } catch (err) {
      console.error('Erreur de réordonnancement:', err.message);
    }

    const embed = new EmbedBuilder()
      .setTitle('🌙 Configuration des rôles RonflexCorp')
      .setColor(0xC9A66B)
      .addFields(
        { name: `✅ Créés (${created.length})`, value: created.join('\n') || 'Aucun (tous existaient déjà)' },
        { name: `⏭️ Déjà existants (${skipped.length})`, value: skipped.join('\n') || 'Aucun' },
      )
      .setFooter({ text: "Pense à assigner Ronflex_On_Top, ImMat_ et Suzu_Rcorps à leurs rôles manuellement." });

    return interaction.editReply({ embeds: [embed] });
  },
};
