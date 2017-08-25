// Type definitions for inspector (built-in module in Node 8+)
// Project: http://nodejs.org/
// Definitions by: Kelvin Jin <https://github.com/kjin>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

// Note: These definitions are auto-generated.
// Please see https://github.com/DefinitelyTyped/DefinitelyTyped/pull/19330
// for more information.

// # referenceMain

/**
 * The inspector module provides an API for interacting with the V8 inspector.
 */
declare module "inspector" {
  import { EventEmitter } from 'events';

  export interface InspectorNotification<T> {
    method: string;
    params: T;
  }

  // # interfaceDefinitions

  /**
   * The inspector.Session is used for dispatching messages to the V8 inspector back-end and receiving message responses and notifications.
   */
  export class Session extends EventEmitter {
    /**
     * Create a new instance of the inspector.Session class. The inspector session needs to be connected through session.connect() before the messages can be dispatched to the inspector backend.
     */
    constructor();

    /**
     * Connects a session to the inspector back-end. An exception will be thrown if there is already a connected session established either through the API or by a front-end connected to the Inspector WebSocket port.
     */
    connect(): void;

    /**
     * Immediately close the session. All pending message callbacks will be called with an error. session.connect() will need to be called to be able to send messages again. Reconnected session will lose all inspector state, such as enabled agents or configured breakpoints.
     */
    disconnect(): void;

    /**
     * Posts a message to the inspector back-end. callback will be notified when a response is received. callback is a function that accepts two optional arguments - error and message-specific result.
     */
    post(method: string, params?: object, callback?: (err: Error, params?: object) => void): void;
    post(method: string, callback?: (err: Error, params?: object) => void): void;

    // # postOverloads

    // Events

    // # eventOverloads
  }

  // Top Level API

  /**
   * Activate inspector on host and port. Equivalent to node --inspect=[[host:]port], but can be done programatically after node has started.
   * If wait is true, will block until a client has connected to the inspect port and flow control has been passed to the debugger client.
   * @param port Port to listen on for inspector connections. Optional, defaults to what was specified on the CLI.
   * @param host Host to listen on for inspector connections. Optional, defaults to what was specified on the CLI.
   * @param wait Block until a client has connected. Optional, defaults to false.
   */
  export function open(port?: number, host?: string, wait?: boolean): void;

  /**
   * Deactivate the inspector. Blocks until there are no active connections.
   */
  export function close(): void;

  /**
   * Return the URL of the active inspector, or undefined if there is none.
   */
  export function url(): string;
}
