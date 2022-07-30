
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    //const on = localStorage.content;

    const id = writable(localStorage.getItem("id") || 0);
    id.subscribe((val) => localStorage.setItem("id", val));

    const logged = writable(localStorage.getItem("logged") || false);
    logged.subscribe((val) => localStorage.setItem("logged", val));

    const level = writable(localStorage.getItem("level") || 0);
    level.subscribe((val) => localStorage.setItem("level", val));

    const losses = writable(localStorage.getItem("losses") || 0);
    losses.subscribe((val) => localStorage.setItem("losses", val));

    const wins = writable(localStorage.getItem("wins") || 0);
    wins.subscribe((val) => localStorage.setItem("wins", val));

    const username = writable(localStorage.getItem("username") || "player");
    username.subscribe((val) => localStorage.setItem("username", val));

    const image_url = writable(localStorage.getItem("image_url") || "img/default_profile.png");
    image_url.subscribe((val) => localStorage.setItem("image_url", val));

    const firstname = writable(localStorage.getItem("firstname") || "");
    firstname.subscribe((val) => localStorage.setItem("firstname", val));

    const lastname = writable(localStorage.getItem("lastname") || "");
    lastname.subscribe((val) => localStorage.setItem("lastname", val));

    // const itemName = "array";
    // const retrieved = localStorage.getItem(itemName);
    // //const parsed = JSON.parse(retrieved);
    // export const array = writable(parsed || []);
    // array.subscribe(val => localStorage.setItem(itemName, JSON.stringify(val)));

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.49.0 */

    const { Error: Error_1, Object: Object_1, console: console_1$3 } = globals;

    // (251:0) {:else}
    function create_else_block$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Chat.svelte generated by Svelte v3.49.0 */
    const file$6 = "src/routes/Chat.svelte";

    function create_fragment$6(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Unavailable yet";
    			set_style(h1, "font-family", "'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif");
    			set_style(h1, "text-align", "center");
    			add_location(h1, file$6, 3, 4, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Chat', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Chat> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Chat extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chat",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/routes/Home.svelte generated by Svelte v3.49.0 */

    const { console: console_1$2 } = globals;

    const file$5 = "src/routes/Home.svelte";

    // (78:4) {:else}
    function create_else_block$2(ctx) {
    	let a;
    	let t;
    	let br;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("Connect with");
    			br = element("br");
    			img = element("img");
    			add_location(br, file$5, 78, 218, 3920);
    			if (!src_url_equal(img.src, img_src_value = "img/42_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "40px");
    			attr_dev(img, "alt", "42 logo");
    			add_location(img, file$5, 78, 222, 3924);
    			attr_dev(a, "href", "https://api.intra.42.fr/oauth/authorize?client_id=3e6e67d52700f32ea72111aee9b04403f78ba98745a76856cf11003de9399fa2&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2F&response_type=code");
    			attr_dev(a, "class", "api svelte-1ooggka");
    			add_location(a, file$5, 78, 4, 3706);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    			append_dev(a, br);
    			append_dev(a, img);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(78:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:2) {#if $logged === 'true'}
    function create_if_block$2(ctx) {
    	let h1;
    	let t1;
    	let div;
    	let p;
    	let t3;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Just a bit of history...";
    			t1 = space();
    			div = element("div");
    			p = element("p");
    			p.textContent = "Pong is a table tennis–themed twitch arcade sports video game,\n        featuring simple two-dimensional graphics, manufactured by Atari \n        and originally released in 1972. It was one of the earliest arcade \n        video games; it was created by Allan Alcorn as a training exercise \n        assigned to him by Atari co-founder Nolan Bushnell, but Bushnell \n        and Atari co-founder Ted Dabney were surprised by the quality of \n        Alcorn's work and decided to manufacture the game. Bushnell based \n        the game's concept on an electronic ping-pong game included in the \n        Magnavox Odyssey, the first home video game console. In response, \n        Magnavox later sued Atari for patent infringement.";
    			t3 = space();
    			img = element("img");
    			set_style(h1, "text-align", "center");
    			set_style(h1, "font-weight", "700");
    			set_style(h1, "margin-top", "50px");
    			add_location(h1, file$5, 63, 2, 2680);
    			add_location(p, file$5, 65, 6, 2808);
    			if (!src_url_equal(img.src, img_src_value = "img/console.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "margin", "0px auto");
    			set_style(img, "display", "block");
    			set_style(img, "width", "250px");
    			set_style(img, "padding-top", "20px");
    			attr_dev(img, "alt", "First Pong Game console");
    			add_location(img, file$5, 75, 8, 3545);
    			attr_dev(div, "class", "about svelte-1ooggka");
    			add_location(div, file$5, 64, 4, 2782);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t3);
    			append_dev(div, img);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(63:2) {#if $logged === 'true'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;

    	function select_block_type(ctx, dirty) {
    		if (/*$logged*/ ctx[0] === 'true') return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "svelte-1ooggka");
    			add_location(main, file$5, 61, 0, 2644);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_block.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $logged;
    	validate_store(logged, 'logged');
    	component_subscribe($$self, logged, $$value => $$invalidate(0, $logged = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let isAuth;

    	// function updateAll (isAuth: any) {
    	//       logged.update(n => isAuth.logged);
    	//       username.update(n => isAuth.username);
    	//       wins.update(n => isAuth.wins);
    	//       losses.update(n => isAuth.losses);
    	//       level.update(n => isAuth.level);
    	//       image_url.update(n => isAuth.image_url);
    	//       firstname.update(n => isAuth.firstname);
    	//       lastname.update(n => isAuth.lastname);
    	//       console.log(isAuth);
    	//       //TODO: modify values in database;
    	// }
    	function updateAll(isAuth) {
    		id.update(n => isAuth.id);
    		logged.update(n => isAuth.logged);
    		username.update(n => isAuth.username);
    		firstname.update(n => isAuth.firstname);
    		lastname.update(n => isAuth.lastname);
    		wins.update(n => isAuth.wins);
    		losses.update(n => isAuth.losses);
    		level.update(n => isAuth.level);
    		image_url.update(n => isAuth.image_url);
    		console.log(isAuth);
    	} //TODO: modify values in database;

    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		if ($logged) {
    			const searchParams = new URLSearchParams(window.location.search);
    			const code = searchParams.get("code");
    			console.log(code);
    			console.log("A");

    			if (code != null) {
    				isAuth = yield fetch("http://localhost:3000/users/callback/", {
    					method: 'POST',
    					headers: {
    						"Content-type": "application/json; charset=UTF-8"
    					},
    					body: JSON.stringify({ "access_token": `${code}` })
    				}).then(response => isAuth = response.json());

    				console.log(isAuth);

    				if (isAuth.logged) {
    					console.log("logged");
    					updateAll(isAuth);
    				}
    			}
    		}
    	}));

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		__awaiter,
    		onMount,
    		level,
    		logged,
    		losses,
    		username,
    		wins,
    		image_url,
    		firstname,
    		lastname,
    		id,
    		isAuth,
    		updateAll,
    		$logged
    	});

    	$$self.$inject_state = $$props => {
    		if ('__awaiter' in $$props) __awaiter = $$props.__awaiter;
    		if ('isAuth' in $$props) isAuth = $$props.isAuth;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$logged];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/routes/NotFound.svelte generated by Svelte v3.49.0 */

    const file$4 = "src/routes/NotFound.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let div0;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let div1;
    	let a;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Page Not Found";
    			t1 = space();
    			p = element("p");
    			p.textContent = "ERROR 404";
    			t3 = space();
    			div1 = element("div");
    			a = element("a");
    			a.textContent = "🔙";
    			attr_dev(h1, "class", "svelte-1cjh4ti");
    			add_location(h1, file$4, 2, 8, 28);
    			add_location(p, file$4, 3, 8, 60);
    			add_location(div0, file$4, 1, 4, 14);
    			attr_dev(a, "href", "#/");
    			attr_dev(a, "class", "svelte-1cjh4ti");
    			add_location(a, file$4, 6, 7, 105);
    			add_location(div1, file$4, 5, 4, 92);
    			attr_dev(section, "class", "svelte-1cjh4ti");
    			add_location(section, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(section, t3);
    			append_dev(section, div1);
    			append_dev(div1, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NotFound', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/routes/Pong.svelte generated by Svelte v3.49.0 */

    const file$3 = "src/routes/Pong.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div3;
    	let t4;
    	let div4;
    	let t5;
    	let div5;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "0";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "0";
    			t3 = space();
    			div3 = element("div");
    			t4 = space();
    			div4 = element("div");
    			t5 = space();
    			div5 = element("div");
    			attr_dev(div0, "id", "player-score");
    			add_location(div0, file$3, 2, 4, 33);
    			attr_dev(div1, "id", "computer-score");
    			add_location(div1, file$3, 3, 4, 68);
    			attr_dev(div2, "class", "score");
    			add_location(div2, file$3, 1, 2, 9);
    			attr_dev(div3, "class", "ball");
    			attr_dev(div3, "id", "ball");
    			add_location(div3, file$3, 5, 2, 112);
    			attr_dev(div4, "class", "paddle left");
    			attr_dev(div4, "id", "player-paddle");
    			add_location(div4, file$3, 6, 2, 149);
    			attr_dev(div5, "class", "paddle right");
    			attr_dev(div5, "id", "computer-paddle");
    			add_location(div5, file$3, 7, 2, 202);
    			add_location(main, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(main, t3);
    			append_dev(main, div3);
    			append_dev(main, t4);
    			append_dev(main, div4);
    			append_dev(main, t5);
    			append_dev(main, div5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const INITIAL_VELOCITY = 0.025;
    const VELOCITY_INCREASE = 0.00001;

    function randomNumberBetween(min, max) {
    	return Math.random() * (max - min) + min;
    }

    function isCollision(rect1, rect2) {
    	return rect1.left <= rect2.right && rect1.right >= rect2.left && rect1.top <= rect2.bottom && rect1.bottom >= rect2.top;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pong', slots, []);

    	class Ball {
    		constructor(ballElem) {
    			this.ballElem = ballElem;
    			this.reset();
    		}

    		get x() {
    			return parseFloat(getComputedStyle(this.ballElem).getPropertyValue("--x"));
    		}

    		set x(value) {
    			this.ballElem.style.setProperty("--x", value);
    		}

    		get y() {
    			return parseFloat(getComputedStyle(this.ballElem).getPropertyValue("--y"));
    		}

    		set y(value) {
    			this.ballElem.style.setProperty("--y", value);
    		}

    		rect() {
    			return this.ballElem.getBoundingClientRect();
    		}

    		reset() {
    			this.x = 50;
    			this.y = 50;
    			this.direction = { x: 0 };

    			while (Math.abs(this.direction.x) <= 0.2 || Math.abs(this.direction.x) >= 0.9) {
    				const heading = randomNumberBetween(0, 2 * Math.PI);

    				this.direction = {
    					x: Math.cos(heading),
    					y: Math.sin(heading)
    				};
    			}

    			this.velocity = INITIAL_VELOCITY;
    		}

    		update(delta, paddleRects) {
    			this.x += this.direction.x * this.velocity * delta;
    			this.y += this.direction.y * this.velocity * delta;
    			this.velocity += VELOCITY_INCREASE * delta;
    			const rect = this.rect();

    			if (rect.bottom >= window.innerHeight || rect.top <= 0) {
    				this.direction.y *= -1;
    			}

    			if (paddleRects.some(r => isCollision(r, rect))) {
    				this.direction.x *= -1;
    			}
    		}
    	}

    	class Paddle {
    		constructor(paddleElem) {
    			this.paddleElem = paddleElem;
    			this.reset();
    		}

    		get position() {
    			return parseFloat(getComputedStyle(this.paddleElem).getPropertyValue("--position"));
    		}

    		set position(value) {
    			this.paddleElem.style.setProperty("--position", value);
    		}

    		rect() {
    			return this.paddleElem.getBoundingClientRect();
    		}

    		reset() {
    			this.position = 50;
    		}

    		update(delta, ballHeight) {
    			this.position += SPEED * delta * (ballHeight - this.position);
    		}
    	}

    	const ball = new Ball(document.getElementById("ball"));
    	const playerPaddle = new Paddle(document.getElementById("player-paddle"));
    	const computerPaddle = new Paddle(document.getElementById("computer-paddle"));
    	const playerScoreElem = document.getElementById("player-score");
    	const computerScoreElem = document.getElementById("computer-score");
    	let lastTime;

    	function update(time) {
    		if (lastTime != null) {
    			const delta = time - lastTime;
    			ball.update(delta, [playerPaddle.rect(), computerPaddle.rect()]);
    			computerPaddle.update(delta, ball.y);
    			const hue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hue"));
    			document.documentElement.style.setProperty("--hue", hue + delta * 0.01);
    			if (isLose()) handleLose();
    		}

    		lastTime = time;
    		window.requestAnimationFrame(update);
    	}

    	function isLose() {
    		const rect = ball.rect();
    		return rect.right >= window.innerWidth || rect.left <= 0;
    	}

    	function handleLose() {
    		const rect = ball.rect();

    		if (rect.right >= window.innerWidth) {
    			playerScoreElem.textContent = parseInt(playerScoreElem.textContent) + 1;
    		} else {
    			computerScoreElem.textContent = parseInt(computerScoreElem.textContent) + 1;
    		}

    		ball.reset();
    		computerPaddle.reset();
    	}

    	document.addEventListener("mousemove", e => {
    		playerPaddle.position = e.y / window.innerHeight * 100;
    	});

    	window.requestAnimationFrame(update);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pong> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		INITIAL_VELOCITY,
    		VELOCITY_INCREASE,
    		Ball,
    		randomNumberBetween,
    		isCollision,
    		Paddle,
    		ball,
    		playerPaddle,
    		computerPaddle,
    		playerScoreElem,
    		computerScoreElem,
    		lastTime,
    		update,
    		isLose,
    		handleLose
    	});

    	$$self.$inject_state = $$props => {
    		if ('lastTime' in $$props) lastTime = $$props.lastTime;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Pong extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pong",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/routes/Profile.svelte generated by Svelte v3.49.0 */

    const { console: console_1$1 } = globals;

    const file$2 = "src/routes/Profile.svelte";

    // (58:4) {:else}
    function create_else_block$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "ACCESS DENIED";
    			set_style(h1, "text-align", "center");
    			add_location(h1, file$2, 58, 4, 2362);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(58:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (38:4) {#if $logged}
    function create_if_block$1(ctx) {
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let p;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let h10;
    	let t5;
    	let t6;
    	let div2;
    	let button;
    	let t8;
    	let input_1;
    	let t9;
    	let div3;
    	let a;
    	let t11;
    	let div4;
    	let h11;
    	let span0;
    	let t13;
    	let span1;
    	let t14;
    	let t15;
    	let h12;
    	let span2;
    	let t17;
    	let span3;
    	let t18;
    	let t19;
    	let h13;
    	let span4;
    	let span5;
    	let t21;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			t1 = text(/*$firstname*/ ctx[3]);
    			t2 = space();
    			t3 = text(/*$lastname*/ ctx[4]);
    			t4 = space();
    			h10 = element("h1");
    			t5 = text(/*$username*/ ctx[5]);
    			t6 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Change profile picture";
    			t8 = space();
    			input_1 = element("input");
    			t9 = space();
    			div3 = element("div");
    			a = element("a");
    			a.textContent = "Change user name";
    			t11 = space();
    			div4 = element("div");
    			h11 = element("h1");
    			span0 = element("span");
    			span0.textContent = "WINS";
    			t13 = space();
    			span1 = element("span");
    			t14 = text(/*$wins*/ ctx[6]);
    			t15 = space();
    			h12 = element("h1");
    			span2 = element("span");
    			span2.textContent = "LOSSES";
    			t17 = space();
    			span3 = element("span");
    			t18 = text(/*$losses*/ ctx[7]);
    			t19 = space();
    			h13 = element("h1");
    			span4 = element("span");
    			span4.textContent = "LEVEL   ";
    			span5 = element("span");
    			t21 = text(/*$level*/ ctx[8]);
    			attr_dev(img, "class", "profile svelte-dv22zd");
    			if (!src_url_equal(img.src, img_src_value = /*$image_url*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "200px");
    			attr_dev(img, "alt", "Default Profile");
    			add_location(img, file$2, 39, 8, 1430);
    			add_location(div0, file$2, 38, 4, 1416);
    			set_style(p, "text-align", "center");
    			set_style(p, "color", "grey");
    			set_style(p, "font-weight", "500");
    			add_location(p, file$2, 42, 8, 1537);
    			attr_dev(h10, "class", "name svelte-dv22zd");
    			add_location(h10, file$2, 43, 8, 1632);
    			add_location(div1, file$2, 41, 4, 1523);
    			attr_dev(button, "class", "bt1 svelte-dv22zd");
    			add_location(button, file$2, 46, 8, 1695);
    			set_style(input_1, "display", "none");
    			attr_dev(input_1, "type", "file");
    			attr_dev(input_1, "accept", ".jpg, .jpeg, .png");
    			add_location(input_1, file$2, 47, 8, 1791);
    			add_location(div2, file$2, 45, 4, 1681);
    			attr_dev(a, "class", "bt2 svelte-dv22zd");
    			attr_dev(a, "href", "#/user");
    			add_location(a, file$2, 50, 8, 1984);
    			set_style(div3, "margin", "0 auto");
    			set_style(div3, "width", "200px");
    			add_location(div3, file$2, 49, 4, 1932);
    			attr_dev(span0, "class", "sp1 svelte-dv22zd");
    			add_location(span0, file$2, 53, 12, 2079);
    			attr_dev(span1, "class", "sp2 svelte-dv22zd");
    			add_location(span1, file$2, 53, 45, 2112);
    			add_location(h11, file$2, 53, 8, 2075);
    			attr_dev(span2, "class", "sp1 svelte-dv22zd");
    			add_location(span2, file$2, 54, 12, 2167);
    			attr_dev(span3, "class", "sp2 svelte-dv22zd");
    			add_location(span3, file$2, 54, 47, 2202);
    			add_location(h12, file$2, 54, 8, 2163);
    			attr_dev(span4, "class", "sp1 svelte-dv22zd");
    			add_location(span4, file$2, 55, 12, 2261);
    			attr_dev(span5, "class", "sp2 svelte-dv22zd");
    			add_location(span5, file$2, 55, 45, 2294);
    			add_location(h13, file$2, 55, 8, 2257);
    			attr_dev(div4, "class", "tb1 svelte-dv22zd");
    			add_location(div4, file$2, 52, 4, 2049);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, img);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(div1, t4);
    			append_dev(div1, h10);
    			append_dev(h10, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, button);
    			append_dev(div2, t8);
    			append_dev(div2, input_1);
    			/*input_1_binding*/ ctx[12](input_1);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, a);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h11);
    			append_dev(h11, span0);
    			append_dev(h11, t13);
    			append_dev(h11, span1);
    			append_dev(span1, t14);
    			append_dev(div4, t15);
    			append_dev(div4, h12);
    			append_dev(h12, span2);
    			append_dev(h12, t17);
    			append_dev(h12, span3);
    			append_dev(span3, t18);
    			append_dev(div4, t19);
    			append_dev(div4, h13);
    			append_dev(h13, span4);
    			append_dev(h13, span5);
    			append_dev(span5, t21);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[10], false, false, false),
    					listen_dev(input_1, "change", /*change_handler*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$image_url*/ 2 && !src_url_equal(img.src, img_src_value = /*$image_url*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$firstname*/ 8) set_data_dev(t1, /*$firstname*/ ctx[3]);
    			if (dirty & /*$lastname*/ 16) set_data_dev(t3, /*$lastname*/ ctx[4]);
    			if (dirty & /*$username*/ 32) set_data_dev(t5, /*$username*/ ctx[5]);
    			if (dirty & /*$wins*/ 64) set_data_dev(t14, /*$wins*/ ctx[6]);
    			if (dirty & /*$losses*/ 128) set_data_dev(t18, /*$losses*/ ctx[7]);
    			if (dirty & /*$level*/ 256) set_data_dev(t21, /*$level*/ ctx[8]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div2);
    			/*input_1_binding*/ ctx[12](null);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(38:4) {#if $logged}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;

    	function select_block_type(ctx, dirty) {
    		if (/*$logged*/ ctx[2]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "svelte-dv22zd");
    			add_location(main, file$2, 36, 0, 1387);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_block.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $image_url;
    	let $logged;
    	let $firstname;
    	let $lastname;
    	let $username;
    	let $wins;
    	let $losses;
    	let $level;
    	validate_store(image_url, 'image_url');
    	component_subscribe($$self, image_url, $$value => $$invalidate(1, $image_url = $$value));
    	validate_store(logged, 'logged');
    	component_subscribe($$self, logged, $$value => $$invalidate(2, $logged = $$value));
    	validate_store(firstname, 'firstname');
    	component_subscribe($$self, firstname, $$value => $$invalidate(3, $firstname = $$value));
    	validate_store(lastname, 'lastname');
    	component_subscribe($$self, lastname, $$value => $$invalidate(4, $lastname = $$value));
    	validate_store(username, 'username');
    	component_subscribe($$self, username, $$value => $$invalidate(5, $username = $$value));
    	validate_store(wins, 'wins');
    	component_subscribe($$self, wins, $$value => $$invalidate(6, $wins = $$value));
    	validate_store(losses, 'losses');
    	component_subscribe($$self, losses, $$value => $$invalidate(7, $losses = $$value));
    	validate_store(level, 'level');
    	component_subscribe($$self, level, $$value => $$invalidate(8, $level = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Profile', slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	//  import HomeForm from "../components/HomeForm.svelte"
    	let fileinput;

    	let avatar;

    	const onFileSelected = e => {
    		let image = e.target.files[0];
    		let reader = new FileReader();
    		reader.readAsDataURL(image);

    		reader.onload = e => {
    			avatar = e.target.result;
    			image_url.update(n => avatar);
    			console.log(avatar);
    		};
    	};

    	let user = 'player';
    	let input;
    	let pseudo;
    	let w = "-";
    	let l = "-";
    	let lev = "-";

    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		avatar = { $image_url };
    	}));

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Profile> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		fileinput.click();
    	};

    	const change_handler = e => onFileSelected(e);

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			fileinput = $$value;
    			$$invalidate(0, fileinput);
    		});
    	}

    	$$self.$capture_state = () => ({
    		__awaiter,
    		onMount,
    		level,
    		logged,
    		losses,
    		username,
    		wins,
    		image_url,
    		firstname,
    		lastname,
    		fileinput,
    		avatar,
    		onFileSelected,
    		user,
    		input,
    		pseudo,
    		w,
    		l,
    		lev,
    		$image_url,
    		$logged,
    		$firstname,
    		$lastname,
    		$username,
    		$wins,
    		$losses,
    		$level
    	});

    	$$self.$inject_state = $$props => {
    		if ('__awaiter' in $$props) __awaiter = $$props.__awaiter;
    		if ('fileinput' in $$props) $$invalidate(0, fileinput = $$props.fileinput);
    		if ('avatar' in $$props) avatar = $$props.avatar;
    		if ('user' in $$props) user = $$props.user;
    		if ('input' in $$props) input = $$props.input;
    		if ('pseudo' in $$props) pseudo = $$props.pseudo;
    		if ('w' in $$props) w = $$props.w;
    		if ('l' in $$props) l = $$props.l;
    		if ('lev' in $$props) lev = $$props.lev;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		fileinput,
    		$image_url,
    		$logged,
    		$firstname,
    		$lastname,
    		$username,
    		$wins,
    		$losses,
    		$level,
    		onFileSelected,
    		click_handler,
    		change_handler,
    		input_1_binding
    	];
    }

    class Profile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Profile",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/routes/User.svelte generated by Svelte v3.49.0 */

    const { console: console_1 } = globals;

    const file$1 = "src/routes/User.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let h2;
    	let t1;
    	let div2;
    	let input;
    	let t2;
    	let div0;
    	let a;
    	let t4;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Enter new username";
    			t1 = space();
    			div2 = element("div");
    			input = element("input");
    			t2 = space();
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "Submit";
    			t4 = space();
    			div1 = element("div");
    			add_location(h2, file$1, 24, 2, 634);
    			set_style(input, "width", "150px");
    			attr_dev(input, "aria-label", "Enter new username");
    			add_location(input, file$1, 26, 4, 674);
    			attr_dev(a, "href", "#/profile");
    			attr_dev(a, "type", "submit");
    			attr_dev(a, "value", "Submit");
    			attr_dev(a, "class", "svelte-nivlyd");
    			add_location(a, file$1, 28, 4, 770);
    			add_location(div0, file$1, 27, 4, 760);
    			attr_dev(div1, "class", "link svelte-nivlyd");
    			add_location(div1, file$1, 30, 2, 867);
    			add_location(div2, file$1, 25, 2, 664);
    			attr_dev(main, "class", "svelte-nivlyd");
    			add_location(main, file$1, 23, 0, 625);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t1);
    			append_dev(main, div2);
    			append_dev(div2, input);
    			set_input_value(input, /*user*/ ctx[0]);
    			append_dev(div2, t2);
    			append_dev(div2, div0);
    			append_dev(div0, a);
    			append_dev(div2, t4);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[2]),
    					listen_dev(a, "click", /*changeUserName*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*user*/ 1 && input.value !== /*user*/ ctx[0]) {
    				set_input_value(input, /*user*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('User', slots, []);
    	let user;

    	async function changeUserName() {
    		username.update(n => user);

    		//TODO: transfer to database;
    		// await fetch("http://localhost:3000/", {
    		//   method: 'POST',
    		//     headers: 
    		//     {
    		//      "Content-type": "application/json; charset=UTF-8",
    		//      //TOKEN psersonnel
    		//     },
    		//     body: JSON.stringify({"username": user,})
    		// }; 
    		alert("Your username has beem changed to " + user);

    		redirect("#/profile");
    		console.log({ user });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<User> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		user = this.value;
    		$$invalidate(0, user);
    	}

    	$$self.$capture_state = () => ({
    		level,
    		logged,
    		losses,
    		username,
    		wins,
    		image_url,
    		firstname,
    		lastname,
    		user,
    		changeUserName
    	});

    	$$self.$inject_state = $$props => {
    		if ('user' in $$props) $$invalidate(0, user = $$props.user);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [user, changeUserName, input_input_handler];
    }

    class User extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "User",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.49.0 */
    const file = "src/App.svelte";

    // (36:2) {:else}
    function create_else_block(ctx) {
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let a3;
    	let t7;
    	let a4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			a0.textContent = "HOME";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "PONG";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "PROFILE";
    			t5 = space();
    			a3 = element("a");
    			a3.textContent = "CHAT";
    			t7 = space();
    			a4 = element("a");
    			a4.textContent = "LOGOUT";
    			attr_dev(a0, "class", "item svelte-s2ct73");
    			attr_dev(a0, "href", "#/");
    			add_location(a0, file, 36, 2, 1012);
    			attr_dev(a1, "class", "item svelte-s2ct73");
    			attr_dev(a1, "href", "#/");
    			add_location(a1, file, 37, 2, 1049);
    			attr_dev(a2, "class", "item svelte-s2ct73");
    			attr_dev(a2, "href", "#/");
    			add_location(a2, file, 38, 2, 1086);
    			attr_dev(a3, "class", "item svelte-s2ct73");
    			attr_dev(a3, "href", "#/");
    			add_location(a3, file, 39, 2, 1126);
    			attr_dev(a4, "class", "item svelte-s2ct73");
    			attr_dev(a4, "href", "#/");
    			add_location(a4, file, 40, 2, 1163);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, a2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, a3, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, a4, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a4, "click", /*logOut*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(a2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(a3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(a4);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(36:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (30:2) {#if $logged}
    function create_if_block(ctx) {
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let a3;
    	let t7;
    	let a4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			a0.textContent = "HOME";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "PONG";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "PROFILE";
    			t5 = space();
    			a3 = element("a");
    			a3.textContent = "CHAT";
    			t7 = space();
    			a4 = element("a");
    			a4.textContent = "LOGOUT";
    			attr_dev(a0, "class", "item svelte-s2ct73");
    			attr_dev(a0, "href", "#/");
    			add_location(a0, file, 30, 2, 759);
    			attr_dev(a1, "class", "item svelte-s2ct73");
    			attr_dev(a1, "href", "#/pong");
    			add_location(a1, file, 31, 2, 796);
    			attr_dev(a2, "class", "item svelte-s2ct73");
    			attr_dev(a2, "href", "#/profile");
    			add_location(a2, file, 32, 2, 837);
    			attr_dev(a3, "class", "item svelte-s2ct73");
    			attr_dev(a3, "href", "#/chat");
    			add_location(a3, file, 33, 2, 884);
    			attr_dev(a4, "class", "item svelte-s2ct73");
    			attr_dev(a4, "href", "http://localhost:8080/");
    			add_location(a4, file, 34, 2, 925);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, a2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, a3, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, a4, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a4, "click", /*logOut*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(a2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(a3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(a4);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(30:2) {#if $logged}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let img;
    	let img_src_value;
    	let t0;
    	let nav;
    	let t1;
    	let router;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*$logged*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	router = new Router({
    			props: { routes: /*routes*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			img = element("img");
    			t0 = space();
    			nav = element("nav");
    			if_block.c();
    			t1 = space();
    			create_component(router.$$.fragment);
    			if (!src_url_equal(img.src, img_src_value = "img/pong.svg")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "300px");
    			attr_dev(img, "alt", "Pong icon");
    			add_location(img, file, 27, 1, 658);
    			attr_dev(nav, "class", "menu svelte-s2ct73");
    			add_location(nav, file, 28, 1, 722);
    			attr_dev(main, "class", "svelte-s2ct73");
    			add_location(main, file, 26, 0, 650);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, img);
    			append_dev(main, t0);
    			append_dev(main, nav);
    			if_block.m(nav, null);
    			insert_dev(target, t1, anchor);
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(nav, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    			if (detaching) detach_dev(t1);
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $logged;
    	validate_store(logged, 'logged');
    	component_subscribe($$self, logged, $$value => $$invalidate(0, $logged = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let routes = {
    		// "/": Home,
    		"/": Home,
    		"/pong": Pong,
    		"/chat": Chat,
    		"/profile": Profile,
    		"/user": User,
    		"/*": NotFound
    	};

    	function logOut() {
    		if ($logged) {
    			logged.update(n => false);
    			alert("You successfully logged out");
    		}
    	}
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		logged,
    		Router,
    		Chat,
    		Home,
    		NotFound,
    		Pong,
    		Profile,
    		User,
    		routes,
    		logOut,
    		$logged
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(1, routes = $$props.routes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$logged, routes, logOut];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
