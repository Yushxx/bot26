const { Telegraf } = require('telegraf');
const mysql = require('mysql2');
const http = require('http');

// Remplacez par votre jeton de bot Telegram
const bot = new Telegraf('7055389679:AAHgPOvZ0UWArqOvNszAIBsfuvaOf-U4oDI');

// Configurer la connexion MySQL
const db = mysql.createConnection({
  host: '109.70.148.57',
  user: 'solkahor_aire',
  password: '#Fuck0099',
  database: 'solkahor_aire'
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    return;
  }
  console.log('Connecté à la base de données MySQL');
});

// Fonction pour vérifier si l'utilisateur est déjà enregistré
function isUserRegistered(userId, callback) {
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', err);
      callback(false);
      return;
    }
    callback(results.length > 0);
  });
}

// Fonction pour enregistrer un nouvel utilisateur
function registerUser(userId, username, referrerId) {
  db.query('INSERT INTO users (id, username, balance, invited_count, referrer_id) VALUES (?, ?, 0, 0, ?)', [userId, username, referrerId], (err) => {
    if (err) {
      console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', err);
      return;
    }
    console.log('Utilisateur enregistré:', userId);

    // Mettre à jour le compteur d'invités du parrain
    if (referrerId) {
      db.query('UPDATE users SET invited_count = invited_count + 1 WHERE id = ?', [referrerId], (err) => {
        if (err) {
          console.error('Erreur lors de la mise à jour du compteur d\'invités:', err);
        } else {
          console.log('Compteur d\'invités mis à jour pour:', referrerId);
        }
      });
    }
  });
}

// Commande /start
bot.start((ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || 'Utilisateur';
  const referrerId = ctx.startPayload ? parseInt(ctx.startPayload) : null; // Utilisé pour les parrainages

  isUserRegistered(userId, (registered) => {
    if (!registered) {
      registerUser(userId, username, referrerId);
    }
  });

  ctx.reply(`Salut, bienvenue dans le programme de récompense GxGcash. Veuillez rejoindre les canaux ci-dessous avant de continuer:`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Canal 1', url: 'https://t.me/+YbIDtsrloZZiNmE0' }],
        [{ text: 'Canal 2', url: 'https://t.me/+rSXyxHTwcN5lNWE0' }],
        [{ text: 'Check✅️', callback_data: 'check' }]
      ]
    },
    parse_mode: 'Markdown'
  });
});

// Vérification de l'adhésion aux canaux
bot.action('check', (ctx) => {
  const userId = ctx.from.id;

  Promise.all([
    bot.telegram.getChatMember('-1001923341484', userId),
    bot.telegram.getChatMember('-1002191790432', userId)
  ])
    .then(([member1, member2]) => {
      if (['member', 'administrator', 'creator'].includes(member1.status) &&
          ['member', 'administrator', 'creator'].includes(member2.status)) {
        ctx.reply('Bienvenue au tableau de bord', {
          reply_markup: {
            keyboard: [
              [{ text: 'Mon compte 👥' }, { text: 'Inviter🫂' }],
              [{ text: 'Play to win 🎮' }, { text: 'Withdrawal💰' }],
              [{ text: 'Support📩' }, { text: 'tuto' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false 
          }
        });
      } else {
        ctx.reply('Veuillez rejoindre les canaux avant de continuer.');
      }
    })
    .catch((err) => {
      console.error('Erreur lors de la vérification des membres:', err);
      ctx.reply('Une erreur est survenue lors de la vérification. Veuillez réessayer.');
    });
});

// Mon compte
bot.hears('Mon compte 👥', (ctx) => {
  const userId = ctx.from.id;

  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des informations utilisateur:', err);
      ctx.reply('Une erreur est survenue. Veuillez réessayer plus tard.');
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      const balance = user.invited_count * 700; // Calculer le solde
      ctx.reply(`🤴🏻 Mon compte\n🆔 ID: ${user.id}\n💰Balance: ${balance} Fcfa\n🫂Invités: ${user.invited_count}`);
    } else {
      ctx.reply('Utilisateur non trouvé.');
    }
  });
});

// Inviter
bot.hears('Inviter🫂', (ctx) => {
  const userId = ctx.from.id;
  ctx.reply(`Partager ce lien et gagnez 700 Fcfa à chaque invité:\n🔗Lien: https://t.me/Hush_cashbot?start=${userId}`);
});

// Play to win 🎮
bot.hears('Play to win 🎮', (ctx) => {
  const userId = ctx.from.id;

  // Le lien pour jouer, avec un code d'accès unique basé sur l'ID de l'utilisateur
  const playLink = `https://t.me/gxgcashbot/notcoin?ref=${userId}`;

  // Envoyer un message avec le code d'accès unique et un bouton inline "Play"
  ctx.reply(`Taper et gagner des pièces\n\nVotre code d'accès: ${userId}\n\nCliquez en bas pour commencer`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Play', url: playLink }]  // Bouton "Play" qui redirige vers le lien
      ]
    }
  });
});

// Withdrawal
bot.hears('Withdrawal💰', (ctx) => {
  const userId = ctx.from.id;

  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification du solde:', err);
      ctx.reply('Une erreur est survenue. Veuillez réessayer plus tard.');
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      const balance = user.invited_count * 700; // Calculer le solde
      if (balance >= 30000) {
        ctx.reply('Envoyez votre mode de paiement.');
      } else {
        ctx.reply('Le minimum de retrait est de 30.000 Fcfa.');
      }
    } else {
      ctx.reply('Utilisateur non trouvé.');
    }
  });
});

// tuto
bot.hears('tuto', (ctx) => {
  ctx.reply(`tuto👇`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'voir le tutoriel🔗', url: 'https://t.me/gxgcaca' }]
      ]
    },
    parse_mode: 'Markdown'
  });
});

// Support
bot.hears('Support📩', (ctx) => {
  ctx.reply('Contact: @Medatt00');
});

bot.launch();

console.log('Bot démarré');

// Code keep_alive pour éviter que le bot ne s'endorme
http.createServer(function (req, res) {
    res.write("I'm alive");
    res.end();
}).listen(8080);
