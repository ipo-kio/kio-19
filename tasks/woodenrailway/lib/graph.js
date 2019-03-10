export class Graph {
    _data = new Map(); //Map<object,Map<object, value>>
    _back_data = new Map();

    _kraskal_result = null;

    constructor() {
    }

    add_vertex(object) {
        if (!this._data.has(object))
            this._data.set(object, new Map());
        if (!this._back_data.has(object))
            this._back_data.set(object, new Map());
        this._invalidate();
    }

    static _add_edge(object1, object2, value, _data) {
        let map1 = _data.get(object1);
        if (map1 !== undefined) {
            let values_list = map1.get(object2);
            if (values_list === undefined)
                map1.set(object2, [value]);
            else
                values_list.push(value);
        }
    }

    add_edge(object1, object2, value) {
        Graph._add_edge(object1, object2, value, this._data);
        Graph._add_edge(object2, object1, value, this._back_data);
        this._invalidate();
    }

    *vertices() {
        for (let v of this._data.keys())
            yield v;
    }

    *edges(vertex, back=false) {
        let data = back ? this._back_data : this._data;

        let e = data.get(vertex);
        if (e !== undefined)
            for (let [v2, list_values] of e)//e = Map: vertex -> [values]
                for (let value of list_values)
                    yield [v2, value];
    }

    toString() {
        function mapToString(m) {
            let result = '';
            for (let o of m.keys())
                result += '(' + o + ')';
            return result;
        }

        let result = '';
        for (let [k, v] of this._data)
            result += k + ": " + mapToString(v) + "\n";
        return result;
    }

    dfs(vertex, fun) {
        let visited = new Set();
        let data = this._data;
        let back_data = this._back_data;
        return inner_dfs(vertex, fun);

        function inner_dfs(vertex, fun) {
            visited.add(vertex);

            let list = [];

            function iter_edges(data, is_forward) {
                let edges = data.get(vertex);
                if (edges !== undefined)
                    for (let [v, edge_value] of edges)
                        if (!visited.has(v)) {
                            let val = inner_dfs(v, fun);
                            if (val !== null)
                                list.push({value: val, edge: [edge_value[0], is_forward]});
                        }
            }

            iter_edges(data, true);
            iter_edges(back_data, false);

            return fun(vertex, list);
        }
    }

    kraskal() { //returns list of edges [v1, v2] and list of all other edges
        if (this._kraskal_result !== null)
            return this._kraskal_result;

        let vertices = Array.from(this.vertices());
        let n = vertices.length;
        let v2index = new Map();

        let i = 0;
        for (let v of vertices)
            v2index.set(v, i++);

        let colors = new Array(n);
        for (let i = 0; i < n; i++)
            colors[i] = i;

        let edges = [];

        for (let v1 of vertices) {
            let i1 = v2index.get(v1);
            for (let [v2, edge_value] of this.edges(v1)) {
                //edge v1 -> v2
                let i2 = v2index.get(v2);
                let c1 = colors[i1];
                let c2 = colors[i2];

                if (c1 === c2)
                    continue;

                for (let i = 0; i < n; i++)
                    if (colors[i] === c2)
                        colors[i] = c1;

                edges.push([v1, v2, edge_value]);
            }
        }

        let components_count = n - edges.length; //TODO we need only number of edges, not edges by themselves

        this._kraskal_result = {vertices, colors, components_count};
        return this._kraskal_result;
    }

    _invalidate() {
        this._kraskal_result = null;
    }
}