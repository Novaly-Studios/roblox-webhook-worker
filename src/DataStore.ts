export class DataStore {
    constructor(private UniverseID: string, private OpenCloudAPIKey: string) {
        this.UniverseID = UniverseID;
        this.OpenCloudAPIKey = OpenCloudAPIKey;
    }

    /**
     * Delete a key from a Roblox DataStore. Optionally, you can provide a callback function to handle the response.
     */
    async delete(storeName: string, key: string, callback?: (success: boolean, response: Response) => void): Promise<boolean> {
        const url = new URL(`https://apis.roblox.com/datastores/v1/universes/${this.UniverseID}/standard-datastores/datastore/entries/entry`);
        url.searchParams.append("entryKey", key);
        url.searchParams.append("datastoreName", storeName);

        const response = await fetch(url.toString(), {
            method: "DELETE",
            headers: {
                "x-api-key": this.OpenCloudAPIKey
            }
        });

        if (callback) await callback(response.ok, response);

        return response.ok;
    }
}