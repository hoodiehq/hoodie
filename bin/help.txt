Usage: npm start -- [options...]

 -h, --help           Show this help message
 -v, --version        Show used hoodie version
     --loglevel       One of silly, verbose, http, info, warn, error, or silent (optional) Default: 'warn'

     --path           Project path (optional) Default: process.cwd()

     --port           Port-number to run the Hoodie App on (optional)
     --bind-address   Address that Hoodie binds to (optional) Default: 127.0.0.1
     --www            WWW path (optional) Default: path.join(options.path, 'www')

     --admin-port     Port-number to run the admin-dashboard on (optional)
     --admin-password Password for the admin-dashboard (required on first run)

     --db-port        Port-number to run the PouchDB Server on (optional)
 -m, --in-memory      Start the PouchDB Server in memory (optional) Default: false
     --db-password    Password to use for the PouchDB Server admin user (optional)
     --db-url         If provided does not start PouchDB Server and uses external CouchDB. Has to contain credentials. (optional)
     --data           Data path (optional) Default: path.join(options.path, 'data')

Options can also be specified as environment variables (prefixed with "hoodie_") or inside a ".hoodierc" file (json or ini).
