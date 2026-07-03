const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readJsonFileOrCreate, writeJsonFile } = require('../utils/github');
const { isAuthorized } = require('../utils/permissions');

// Le PokeShop n'est pas géré ici : il utilise déjà data/pokemon.json via la commande /pokemon,
// exactement comme la Pension. Ce fichier ne gère que l'ItemShop et le ServiceShop.
const SHOP_PATHS = {
  itemshop: 'data/itemshop.json',
  serviceshop: 'data/serviceshop.json',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription("Gérer l'ItemShop ou le ServiceShop (pour la Pension/PokeShop, utilise /pokemon)")
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Ajouter un article/service')
      .addStringOption(o => o.setName('boutique').setDescription('Quelle boutique').setRequired(true)
        .addChoices(
          { name: 'ItemShop', value: 'itemshop' },
          { name: 'ServiceShop', value: 'serviceshop' },
        ))
      .addStringOption(o => o.setName('nom').setDescription("Nom de l'article/service").setRequired(true))
      .addStringOption(o => o.setName('prix').setDescription('Prix affiché, ex. "45$", "Dès 100$", "50$/h", "Offert"').setRequired(true))
      .addStringOption(o => o.setName('description').setDescription('Description courte').setRequired(false))
      .addStringOption(o => o.setName('icone').setDescription('Un seul emoji affiché sur la carte').setRequired(false))
      .addStringOption(o => o.setName('badge').setDescription('Ex. "Disponible", "Sur devis", "Réservé Titans", "Membres"').setRequired(false))
    )
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription("Retirer un article/service")
      .addStringOption(o => o.setName('boutique').setDescription('Quelle boutique').setRequired(true)
        .addChoices(
          { name: 'ItemShop', value: 'itemshop' },
          { name: 'ServiceShop', value: 'serviceshop' },
        ))
      .addStringOption(o => o.setName('nom').setDescription('Nom exact de l\'article/service').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription("Voir le contenu d'une boutique")
      .addStringOption(o => o.setName('boutique').setDescription('Quelle boutique').setRequired(true)
        .addChoices(
          { name: 'ItemShop', value: 'itemshop' },
          { name: 'ServiceShop', value: 'serviceshop' },
        ))
    ),

  async execute(interaction) {
    if (!isAuthorized(interaction)) {
      return interaction.reply({ content: "⛔ Tu n'as pas la permission d'utiliser cette commande.", ephemeral: true });
    }
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const boutique = interaction.options.getString('boutique');
    const path = SHOP_PATHS[boutique];
    const { data: items, sha } = await readJsonFileOrCreate(path);

    if (sub === 'add') {
      const nom = interaction.options.getString('nom');
      const prix = interaction.options.getString('prix');
      const description = interaction.options.getString('description') || '';
      const icone = interaction.options.getString('icone') || (boutique === 'itemshop' ? '🛒' : '🛠️');
      const badge = interaction.options.getString('badge') || 'Disponible';
      const newItem = {
        id: items.length ? Math.max(...items.map(i => i.id)) + 1 : 0,
        icone, nom, description, prix, badge,
      };
      items.push(newItem);
      await writeJsonFile(path, items, sha, `Ajout de "${nom}" dans ${boutique} via le bot Discord (par ${interaction.user.tag})`);
      const embed = new EmbedBuilder()
        .setTitle(`${icone} "${nom}" ajouté au ${boutique}`)
        .setColor(0xC9A66B)
        .addFields(
          { name: 'Prix', value: prix, inline: true },
          { name: 'Statut', value: badge, inline: true },
        );
      if (description) embed.setDescription(description);
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      const nom = interaction.options.getString('nom');
      const idx = items.findIndex(i => i.nom.toLowerCase() === nom.toLowerCase());
      if (idx === -1) return interaction.editReply(`❌ Aucun article "${nom}" trouvé dans ${boutique}.`);
      items.splice(idx, 1);
      await writeJsonFile(path, items, sha, `Retrait de "${nom}" de ${boutique} via le bot Discord (par ${interaction.user.tag})`);
      return interaction.editReply(`🗑️ "${nom}" retiré du ${boutique}.`);
    }

    if (sub === 'list') {
      const embed = new EmbedBuilder()
        .setTitle(`🛒 Contenu de ${boutique}`)
        .setColor(0xC9A66B)
        .setDescription(items.map(i => `${i.icone || '•'} **${i.nom}** — ${i.prix} — ${i.badge}`).join('\n') || 'Boutique vide.');
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
