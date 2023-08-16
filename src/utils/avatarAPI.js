const apiKey = 'h5H87UTjIXWrBZ';

export const fetchRandomAvatar = async (id) => {
    try {
        const response = await fetch(`https://api.multiavatar.com/${id}?apikey=${apiKey}`);
        if (!response.ok) {
            throw new Error('Failed to fetch avatar');
        }
        const svg = await response.text();
        return svg;
    } catch (error) {
        console.error(error);
        return null;
    }
};