
function getFromLocalStorage<T>(key: string, initialValue: T): T {
    try {
        const item = window.localStorage.getItem(key);
        if (item == null) {
            window.localStorage.setItem(key, JSON.stringify(initialValue));
            return initialValue;
        }

        return JSON.parse(item);
    } catch (error) {
        console.error("Error reading localStorage key ", key, error);
        return initialValue;
    }
}

function setToLocalStorage<T>(key: string, value: T) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Error writing localStorage key ", key, error);
    }
}

export {getFromLocalStorage, setToLocalStorage};
