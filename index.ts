import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Compiler, loader } from 'webpack';
import { getOptions } from 'loader-utils';

interface ManifestPropertyMapping {
    [index: string]: string | true;
}

interface ManifestPropertyList extends Array<string | ManifestPropertyMapping> {}

interface PluginOptions {
    properties: ManifestPropertyList | ManifestPropertyMapping;
    source: string;
}

const ENTRY_NAME = '@@chrome-manifest';

export class ChromeManifestSyncWebpackPlugin {
    private readonly options: PluginOptions;

    constructor(options: Partial<PluginOptions> = {}) {
        const { properties: props, ...otherOptions } = options;
        const properties = makePropertyMap(props || [
            'version',
            'description',
            'author',
            { homepage_url: 'homepage' }
        ]);

        this.options = {
            source: './manifest.json',

            properties,
            ...otherOptions,
        };
    }

    apply(compiler: Compiler) {
        const { properties, source } = this.options;
        const { options } = compiler;

        let { entry } = options;

        if (Array.isArray(entry) || typeof entry === 'string') {
            entry = { main: entry };
        }

        const sourcePath = resolve(source);

        options.entry = {
            ...(entry || {}),
            [ENTRY_NAME]: sourcePath,
        };

        const { output = {} } = options;
        const { filename } = output;

        options.output = {
            ...output,
            filename: (chunkData): string => {
                if (chunkData.chunk.name === ENTRY_NAME) {
                    return ENTRY_NAME;
                }

                if (filename instanceof Function) {
                    return filename(chunkData);
                }

                return filename || '';
            },
        };

        const { module = { rules: [] } } = options;
        const { rules = [] } = module;

        rules.unshift({
            test: sourcePath,
            loader: {
                loader: __filename,
                options: properties,
            },
        });

        options.module = module;

        compiler.hooks.emit.tap('ChromeManifestSyncWebpackPlugin', (compilation) => {
            delete compilation.assets[ENTRY_NAME];
        });
    }
}

const ChromeManifestSyncWebpackLoader: loader.Loader = function (manifestSource) {
    const properties = getOptions(this) || {};
    const pkgPath = resolve('./package.json');
    const pkg = JSON.parse(readFileSync(pkgPath).toString());
    const manifest = JSON.parse(manifestSource.toString());

    for (const [ dst, src ] of Object.entries(properties)) {
        const value = pkg[typeof src === 'string' ? src : dst];

        if (value !== undefined) {
            manifest[dst] = value;
        }
    }

    const mergedJson = JSON.stringify(manifest);

    this.addDependency(pkgPath);
    this.emitFile('manifest.json', mergedJson, null);

    return mergedJson;
};

export default ChromeManifestSyncWebpackLoader;

const makePropertyMap = (properties: ManifestPropertyList | ManifestPropertyMapping): ManifestPropertyMapping => {
    if (!Array.isArray(properties)) {
        return properties;
    }

    return properties.reduce((map: ManifestPropertyMapping, value) => {
        if (typeof value === 'string') {
            value = { [value]: true };
        }

        return Object.assign(map, value);
    }, {});
};
