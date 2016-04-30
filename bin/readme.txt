Usage: npm start -- [options...]

 -h, --help           Show this help message
 -v, --version        Show used hoodie version
     --loglevel       One of silly, verbose, http, info, warn, error, or silent (optional) Default: 'warn'
     --port           Port-number to run the Hoodie App on (optional)
     --bind-address   Address that Hoodie binds to (optional) Default: 127.0.0.1
     --public         Path to public assets (optional) Default: path.join(options.path, 'public')

 -m, --in-memory      Start the PouchDB Server in memory (optional) Default: false
     --db-url         If provided uses external CouchDB. Has to contain credentials. (optional)
     --data           Data path (optional) Default: path.join(options.path, 'data')

Options can also be specified as environment variables (prefixed with "hoodie_") or inside a ".hoodierc" file (json or ini).
