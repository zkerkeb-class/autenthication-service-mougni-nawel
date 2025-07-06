const axios = require('axios');

const exchangeCodeForToken = async (code) => {
  const response = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    grant_type: 'authorization_code'
  }).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  return response.data;
};

const getUserInfo = async (idToken) => {
  const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  return response.data;
};

const findOrCreateUser = async (userData) => {
  try {
    if (!userData.googleId || !userData.email) {
      throw new Error('Missing required user fields');
    }

    // Normalize email
    userData.email = userData.email.toLowerCase().trim();
    const baseUrl = process.env.API_BDD_URL.replace(/\/+$/, '');
    let user;
    console.log('TESST : ', baseUrl);
    // 1. Essaye de trouver l'utilisateur par googleId
    try {
      const res = await axios.get(`${baseUrl}/api/user/by-google-id/${userData.googleId}`);
    console.log('TESST 2 : ', JSON.stringify(res));

      if (res.data && res.data._id) return res.data; // vérifie présence _id
    } catch (err) {
      // ignore si 404
    }

    // 2. Si non trouvé, essaie par email
    try {
          console.log('TESST 3 : ', JSON.stringify(userData));
      const res = await axios.get(`${baseUrl}/api/user/by-email/${encodeURIComponent(userData.email)}`);
          console.log('TESST 4 : ', res);
      if (res.data && res.data._id) return res.data;
    } catch (err) {
      // ignore si 404
    }

    // 3. Sinon, crée l'utilisateur
          console.log('TESST 5 : ', JSON.stringify(userData));

    const createRes = await axios.post(`${baseUrl}/api/user/google`, userData);
          console.log('TESST 6 : ', createRes.data);

    return createRes.data;

  } catch (error) {
    console.error('Erreur dans findOrCreateUser:', error.message);
    throw new Error('Failed to find or create user');
  }
};
module.exports = {
  exchangeCodeForToken,
  getUserInfo,
  findOrCreateUser
};
