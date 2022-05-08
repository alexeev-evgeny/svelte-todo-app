
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
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
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
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
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    class TodosStore {
        constructor() {
            this.todos = writable([
                {
                    id: 1616150160176,
                    title: 'Number one',
                    text: 'Adasdasdadadasdadadad'
                },
                {
                    id: 1616150176804,
                    title: 'Number two',
                    text: 'Adasdasdadadasdadadad'
                },
                {
                    id: 1616150190615,
                    title: 'Number three',
                    text: 'Adasdasdadadasdadadad'
                }
            ]);
        }
        get todosList() {
            return this.todos;
        }
        addTodo(newTodo) {
            this.todos.update((value) => {
                value.push(newTodo);
                return value;
            });
        }
        removeTodo(todoId) {
            this.todos.update((value) => value.filter(({ id }) => id !== todoId));
        }
    }

    const TODOS_STORE = new TodosStore();

    /* src/components/TodoListItem.svelte generated by Svelte v3.35.0 */
    const file$3 = "src/components/TodoListItem.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let span;
    	let t0_value = /*listItem*/ ctx[0].title + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = /*listItem*/ ctx[0].text + "";
    	let t2;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			button.textContent = "Remove";
    			attr_dev(span, "class", "list-item__title svelte-jnh722");
    			add_location(span, file$3, 11, 1, 228);
    			attr_dev(p, "class", "list-item__text svelte-jnh722");
    			add_location(p, file$3, 14, 1, 289);
    			attr_dev(button, "class", "list-item__button-remove svelte-jnh722");
    			add_location(button, file$3, 17, 1, 342);
    			attr_dev(div, "class", "list-item svelte-jnh722");
    			add_location(div, file$3, 10, 0, 203);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(div, t3);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*remove*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*listItem*/ 1 && t0_value !== (t0_value = /*listItem*/ ctx[0].title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*listItem*/ 1 && t2_value !== (t2_value = /*listItem*/ ctx[0].text + "")) set_data_dev(t2, t2_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TodoListItem", slots, []);
    	
    	const dispatch = createEventDispatcher();
    	let { listItem } = $$props;

    	function remove() {
    		dispatch("remove", listItem.id);
    	}

    	const writable_props = ["listItem"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodoListItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("listItem" in $$props) $$invalidate(0, listItem = $$props.listItem);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		listItem,
    		remove
    	});

    	$$self.$inject_state = $$props => {
    		if ("listItem" in $$props) $$invalidate(0, listItem = $$props.listItem);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [listItem, remove];
    }

    class TodoListItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { listItem: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoListItem",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*listItem*/ ctx[0] === undefined && !("listItem" in props)) {
    			console.warn("<TodoListItem> was created without expected prop 'listItem'");
    		}
    	}

    	get listItem() {
    		throw new Error("<TodoListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listItem(value) {
    		throw new Error("<TodoListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TodoListItemCreate.svelte generated by Svelte v3.35.0 */
    const file$2 = "src/components/TodoListItemCreate.svelte";

    // (56:1) {#if !isFormValid}
    function create_if_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fill the form fields";
    			attr_dev(p, "class", "form__error-message svelte-7iipuf");
    			add_location(p, file$2, 56, 2, 1065);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(56:1) {#if !isFormValid}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div3;
    	let h2;
    	let t1;
    	let div0;
    	let input;
    	let t2;
    	let div1;
    	let textarea;
    	let t3;
    	let div2;
    	let button;
    	let t5;
    	let mounted;
    	let dispose;
    	let if_block = !/*isFormValid*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h2 = element("h2");
    			h2.textContent = "New todo";
    			t1 = space();
    			div0 = element("div");
    			input = element("input");
    			t2 = space();
    			div1 = element("div");
    			textarea = element("textarea");
    			t3 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Add";
    			t5 = space();
    			if (if_block) if_block.c();
    			add_location(h2, file$2, 29, 1, 601);
    			attr_dev(input, "class", "form__input svelte-7iipuf");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Заголовок");
    			add_location(input, file$2, 31, 2, 648);
    			attr_dev(div0, "class", "form__field svelte-7iipuf");
    			add_location(div0, file$2, 30, 1, 620);
    			attr_dev(textarea, "class", "form__input svelte-7iipuf");
    			attr_dev(textarea, "placeholder", "Текст");
    			attr_dev(textarea, "cols", "30");
    			attr_dev(textarea, "rows", "10");
    			add_location(textarea, file$2, 39, 2, 792);
    			attr_dev(div1, "class", "form__field svelte-7iipuf");
    			add_location(div1, file$2, 38, 1, 764);
    			attr_dev(button, "class", "form__button svelte-7iipuf");
    			add_location(button, file$2, 48, 2, 956);
    			attr_dev(div2, "class", "form__field svelte-7iipuf");
    			add_location(div2, file$2, 47, 1, 928);
    			attr_dev(div3, "class", "form svelte-7iipuf");
    			add_location(div3, file$2, 28, 0, 581);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h2);
    			append_dev(div3, t1);
    			append_dev(div3, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*newTodoTitle*/ ctx[0]);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, textarea);
    			set_input_value(textarea, /*newTodoText*/ ctx[1]);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			append_dev(div3, t5);
    			if (if_block) if_block.m(div3, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[5]),
    					listen_dev(button, "click", /*addTodo*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newTodoTitle*/ 1 && input.value !== /*newTodoTitle*/ ctx[0]) {
    				set_input_value(input, /*newTodoTitle*/ ctx[0]);
    			}

    			if (dirty & /*newTodoText*/ 2) {
    				set_input_value(textarea, /*newTodoText*/ ctx[1]);
    			}

    			if (!/*isFormValid*/ ctx[2]) {
    				if (if_block) ; else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
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

    function generateId() {
    	return new Date().getTime();
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TodoListItemCreate", slots, []);
    	const dispatch = createEventDispatcher();
    	let newTodoTitle = "";
    	let newTodoText = "";
    	let isFormValid = true;

    	function addTodo() {
    		if (!newTodoTitle || !newTodoText) {
    			$$invalidate(2, isFormValid = false);
    			return;
    		}

    		$$invalidate(2, isFormValid = true);

    		dispatch("addTodo", {
    			id: generateId(),
    			title: newTodoTitle,
    			text: newTodoText
    		});

    		reset();
    	}

    	function reset() {
    		$$invalidate(0, newTodoTitle = "");
    		$$invalidate(1, newTodoText = "");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodoListItemCreate> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		newTodoTitle = this.value;
    		$$invalidate(0, newTodoTitle);
    	}

    	function textarea_input_handler() {
    		newTodoText = this.value;
    		$$invalidate(1, newTodoText);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		newTodoTitle,
    		newTodoText,
    		isFormValid,
    		addTodo,
    		reset,
    		generateId
    	});

    	$$self.$inject_state = $$props => {
    		if ("newTodoTitle" in $$props) $$invalidate(0, newTodoTitle = $$props.newTodoTitle);
    		if ("newTodoText" in $$props) $$invalidate(1, newTodoText = $$props.newTodoText);
    		if ("isFormValid" in $$props) $$invalidate(2, isFormValid = $$props.isFormValid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		newTodoTitle,
    		newTodoText,
    		isFormValid,
    		addTodo,
    		input_input_handler,
    		textarea_input_handler
    	];
    }

    class TodoListItemCreate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoListItemCreate",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/TodoList.svelte generated by Svelte v3.35.0 */
    const file$1 = "src/components/TodoList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (27:2) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Empty";
    			attr_dev(p, "class", "message-empty svelte-w2b7a");
    			add_location(p, file$1, 27, 3, 651);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(27:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:2) {#if $todos.length}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*$todos*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$todos, onRemoveTodo*/ 10) {
    				each_value = /*$todos*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(20:2) {#if $todos.length}",
    		ctx
    	});

    	return block;
    }

    // (21:3) {#each $todos as todo}
    function create_each_block(ctx) {
    	let todolistitem;
    	let current;

    	todolistitem = new TodoListItem({
    			props: { listItem: /*todo*/ ctx[4] },
    			$$inline: true
    		});

    	todolistitem.$on("remove", /*onRemoveTodo*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(todolistitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(todolistitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todolistitem_changes = {};
    			if (dirty & /*$todos*/ 2) todolistitem_changes.listItem = /*todo*/ ctx[4];
    			todolistitem.$set(todolistitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todolistitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todolistitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todolistitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(21:3) {#each $todos as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let h2;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let t2;
    	let div1;
    	let todolistitemcreate;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$todos*/ ctx[1].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	todolistitemcreate = new TodoListItemCreate({ $$inline: true });
    	todolistitemcreate.$on("addTodo", /*onAddTodo*/ ctx[2]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Todos";
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			div1 = element("div");
    			create_component(todolistitemcreate.$$.fragment);
    			add_location(h2, file$1, 18, 2, 470);
    			attr_dev(div0, "class", "column svelte-w2b7a");
    			add_location(div0, file$1, 17, 1, 447);
    			attr_dev(div1, "class", "column svelte-w2b7a");
    			add_location(div1, file$1, 30, 1, 703);
    			attr_dev(div2, "class", "row svelte-w2b7a");
    			add_location(div2, file$1, 16, 0, 428);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			mount_component(todolistitemcreate, div1, null);
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
    				if_block.m(div0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(todolistitemcreate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(todolistitemcreate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_blocks[current_block_type_index].d();
    			destroy_component(todolistitemcreate);
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
    	let todos;

    	let $todos,
    		$$unsubscribe_todos = noop,
    		$$subscribe_todos = () => ($$unsubscribe_todos(), $$unsubscribe_todos = subscribe(todos, $$value => $$invalidate(1, $todos = $$value)), todos);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_todos());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TodoList", slots, []);
    	

    	function onAddTodo(event) {
    		const { detail: newTodo } = event;
    		TODOS_STORE.addTodo(newTodo);
    	}

    	function onRemoveTodo(event) {
    		const { detail: todoId } = event;
    		TODOS_STORE.removeTodo(todoId);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodoList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		TODOS_STORE,
    		TodoListItem,
    		TodoListItemCreate,
    		onAddTodo,
    		onRemoveTodo,
    		todos,
    		$todos
    	});

    	$$self.$inject_state = $$props => {
    		if ("todos" in $$props) $$subscribe_todos($$invalidate(0, todos = $$props.todos));
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$subscribe_todos($$invalidate(0, todos = TODOS_STORE.todosList));
    	return [todos, $todos, onAddTodo, onRemoveTodo];
    }

    class TodoList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoList",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.35.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let todolist;
    	let current;
    	todolist = new TodoList({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(todolist.$$.fragment);
    			add_location(main, file, 3, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(todolist, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todolist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todolist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(todolist);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ TodoList });
    	return [];
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

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
