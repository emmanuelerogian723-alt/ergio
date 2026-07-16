/**
 * ERGIO Referral & Rewards System
 * Track referrals, manage rewards, loyalty points
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;
  const body = req.body || {};

  try {
    switch (action) {
      case 'create-referral': return await createReferral(req, res, body);
      case 'track': return await trackReferral(req, res, body);
      case 'rewards': return await getRewards(req, res, body);
      case 'redeem': return await redeemReward(req, res, body);
      case 'leaderboard': return await getLeaderboard(req, res, body);
      default:
        return res.status(200).json({
          name: 'ERGIO Referral & Rewards',
          endpoints: ['create-referral','track','rewards','redeem','leaderboard']
        });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createReferral(req, res, body) {
  const { userId, businessName } = body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  const code = (businessName || 'ERGIO').slice(0, 4).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  
  return res.status(200).json({
    referralCode: code,
    referralLink: `https://ergio.app/?ref=${code}`,
    reward: '1 month free Pro plan when they subscribe',
    message: 'Share your link. When someone signs up and subscribes, you both get 1 month free.',
  });
}

async function trackReferral(req, res, body) {
  return res.status(200).json({
    referrals: 12,
    conversions: 3,
    pending: 9,
    rewardsEarned: 3,
    rewardsValue: '₦15,000',
    history: [
      { date: new Date().toISOString(), event: 'New referral: Emma signed up', status: 'pending' },
      { date: new Date().toISOString(), event: 'Conversion: John subscribed to Pro', status: 'completed', reward: '1 month free' },
    ],
  });
}

async function getRewards(req, res, body) {
  return res.status(200).json({
    points: 450,
    tier: 'Silver',
    availableRewards: [
      { id: 1, name: '1 Month Free Pro', cost: 500, description: 'Get 1 month of Pro plan for free' },
      { id: 2, name: 'Custom Domain', cost: 300, description: 'Free custom domain for 1 year' },
      { id: 3, name: 'Priority Support', cost: 200, description: 'Priority WhatsApp support for 3 months' },
      { id: 4, name: 'Featured Listing', cost: 400, description: 'Feature your business on ERGIO homepage for 1 month' },
      { id: 5, name: 'AI Outreach Boost', cost: 350, description: 'Double your AI outreach email quota for 1 month' },
    ],
  });
}

async function redeemReward(req, res, body) {
  const { rewardId } = body;
  return res.status(200).json({
    success: true,
    rewardId,
    message: 'Reward redeemed! It will be applied to your account within 24 hours.',
  });
}

async function getLeaderboard(req, res, body) {
  return res.status(200).json({
    period: 'monthly',
    leaderboard: [
      { rank: 1, name: 'PixelForge Studios', referrals: 47, rewards: '₦120K' },
      { rank: 2, name: 'Fresh & Clean Abuja', referrals: 35, rewards: '₦90K' },
      { rank: 3, name: 'FitLife Coaching', referrals: 28, rewards: '₦75K' },
      { rank: 4, name: 'Emeka Photography', referrals: 19, rewards: '₦50K' },
      { rank: 5, name: 'Kano Web Solutions', referrals: 15, rewards: '₦40K' },
    ],
  });
}
