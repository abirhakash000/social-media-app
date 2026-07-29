const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'my_secret_key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

router.post('/post', verifyToken, async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileExt = image.split(';')[0].split('/')[1] || 'png';
        const fileName = `post_${req.userId}_${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
            .from('images')
            .upload(`posts/${fileName}`, buffer, {
                contentType: `image/${fileExt}`,
                upsert: true
            });

        if (error) {
            return res.status(500).json({ error: 'Upload failed' });
        }

        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(`posts/${fileName}`);

        res.json({ url: urlData.publicUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;