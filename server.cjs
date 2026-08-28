"use strict";

// cPanel/Passenger startup entrypoint for Next.js standalone output.
process.env.NODE_ENV = "production";
process.env.HOSTNAME ||= "0.0.0.0";
process.env.PORT ||= "3000";

require("./.next/standalone/server.js");
