
export enum ChartType {
    LINE,
    BAR,
    LINE_AREA,
    STACKED_BAR,
}

export type MapType<K extends string | number | symbol, V> = {
    [key in K]: V;
};