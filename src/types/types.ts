
export type MapType<K extends string | number | symbol, V> = {
    [key in K]: V;
};