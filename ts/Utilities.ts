export default class Utilities {
    static readonly sanitizeTitle = (title : string) : string => {
        return title.trim().replace(/[^a-z0-9]+/gi,'_').toLowerCase();
    }
}