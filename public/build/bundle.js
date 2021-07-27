
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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

    /* src\components\layouts\NavList.svelte generated by Svelte v3.38.2 */

    const file$a = "src\\components\\layouts\\NavList.svelte";

    function create_fragment$a(ctx) {
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let a1;
    	let t3;
    	let li2;
    	let a2;
    	let t5;
    	let li3;
    	let a3;
    	let ul_class_value;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Products";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Pricing";
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "FAQ";
    			t5 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Blog";
    			attr_dev(a0, "class", "nav__list__item__link");
    			add_location(a0, file$a, 6, 4, 153);
    			attr_dev(li0, "class", "nav__list__item");
    			add_location(li0, file$a, 5, 2, 119);
    			attr_dev(a1, "class", "nav__list__item__link");
    			add_location(a1, file$a, 9, 4, 245);
    			attr_dev(li1, "class", "nav__list__item");
    			add_location(li1, file$a, 8, 2, 211);
    			attr_dev(a2, "class", "nav__list__item__link");
    			add_location(a2, file$a, 12, 4, 336);
    			attr_dev(li2, "class", "nav__list__item");
    			add_location(li2, file$a, 11, 2, 302);
    			attr_dev(a3, "class", "nav__list__item__link");
    			add_location(a3, file$a, 15, 4, 423);
    			attr_dev(li3, "class", "nav__list__item");
    			add_location(li3, file$a, 14, 2, 389);
    			attr_dev(ul, "class", ul_class_value = `nav__list ${/*footer*/ ctx[0] ? "nav__list--footer" : ""}`);
    			add_location(ul, file$a, 4, 0, 52);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*footer*/ 1 && ul_class_value !== (ul_class_value = `nav__list ${/*footer*/ ctx[0] ? "nav__list--footer" : ""}`)) {
    				attr_dev(ul, "class", ul_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NavList", slots, []);
    	let { footer = false } = $$props;
    	const writable_props = ["footer"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NavList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("footer" in $$props) $$invalidate(0, footer = $$props.footer);
    	};

    	$$self.$capture_state = () => ({ footer });

    	$$self.$inject_state = $$props => {
    		if ("footer" in $$props) $$invalidate(0, footer = $$props.footer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [footer];
    }

    class NavList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { footer: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavList",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get footer() {
    		throw new Error("<NavList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set footer(value) {
    		throw new Error("<NavList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\header\Navbar.svelte generated by Svelte v3.38.2 */
    const file$9 = "src\\components\\header\\Navbar.svelte";

    function create_fragment$9(ctx) {
    	let nav;
    	let div0;
    	let span;
    	let img;
    	let img_src_value;
    	let t0;
    	let navlist;
    	let t1;
    	let div1;
    	let button0;
    	let t3;
    	let button1;
    	let current;
    	navlist = new NavList({ $$inline: true });

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			span = element("span");
    			img = element("img");
    			t0 = space();
    			create_component(navlist.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Login";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Sign up";
    			if (img.src !== (img_src_value = "assets/img/logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Logo page");
    			attr_dev(img, "class", "logo__img");
    			add_location(img, file$9, 7, 6, 162);
    			attr_dev(span, "class", "logo");
    			add_location(span, file$9, 6, 4, 135);
    			attr_dev(div0, "class", "navbar__section");
    			add_location(div0, file$9, 5, 2, 100);
    			attr_dev(button0, "class", "button button--lg button--secondary--transparent mr-md-2");
    			add_location(button0, file$9, 16, 4, 342);
    			attr_dev(button1, "class", "button button--lg button--secondary--outline");
    			add_location(button1, file$9, 17, 4, 435);
    			attr_dev(div1, "class", "navbar__section");
    			add_location(div1, file$9, 15, 2, 307);
    			attr_dev(nav, "class", "navbar");
    			add_location(nav, file$9, 4, 0, 76);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(div0, span);
    			append_dev(span, img);
    			append_dev(div0, t0);
    			mount_component(navlist, div0, null);
    			append_dev(nav, t1);
    			append_dev(nav, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(navlist);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ NavList });
    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\components\header\Header.svelte generated by Svelte v3.38.2 */
    const file$8 = "src\\components\\header\\Header.svelte";

    function create_fragment$8(ctx) {
    	let header;
    	let navbar;
    	let t0;
    	let section;
    	let div2;
    	let div0;
    	let h1;
    	let t2;
    	let p;
    	let t4;
    	let button;
    	let t6;
    	let div1;
    	let img;
    	let img_src_value;
    	let current;
    	navbar = new Navbar({ $$inline: true });

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			section = element("section");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Monitor your business on real-time dashboard";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum nisi aliquet volutpat pellentesque volutpat est. Sapien in etiam vitae nibh nunc mattis imperdiet sed nullam.";
    			t4 = space();
    			button = element("button");
    			button.textContent = "Try for free";
    			t6 = space();
    			div1 = element("div");
    			img = element("img");
    			attr_dev(h1, "class", "text text--white text--title");
    			add_location(h1, file$8, 9, 10, 264);
    			attr_dev(p, "class", "text text--gray header__text");
    			add_location(p, file$8, 10, 10, 366);
    			attr_dev(button, "class", "button button--primary button--40p");
    			add_location(button, file$8, 13, 10, 626);
    			attr_dev(div0, "class", "container--flex__item");
    			add_location(div0, file$8, 8, 8, 217);
    			if (img.src !== (img_src_value = "assets/img/chart-header.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "img img--header");
    			add_location(img, file$8, 16, 12, 773);
    			attr_dev(div1, "class", "container--flex__item");
    			add_location(div1, file$8, 15, 8, 724);
    			attr_dev(div2, "class", "container container--flex container--flex--header");
    			add_location(div2, file$8, 7, 6, 144);
    			attr_dev(section, "class", "mt-3");
    			add_location(section, file$8, 6, 4, 114);
    			attr_dev(header, "class", "mx header");
    			add_location(header, file$8, 4, 0, 66);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(navbar, header, null);
    			append_dev(header, t0);
    			append_dev(header, section);
    			append_dev(section, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(div0, t4);
    			append_dev(div0, button);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(navbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\sections\components\Feature.svelte generated by Svelte v3.38.2 */

    const file$7 = "src\\components\\sections\\components\\Feature.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let h3;
    	let strong;
    	let t1;
    	let t2;
    	let p;
    	let t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			h3 = element("h3");
    			strong = element("strong");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*text*/ ctx[1]);
    			if (img.src !== (img_src_value = `assets/img/icons/${/*icon*/ ctx[2]}.svg`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*title*/ ctx[0]);
    			add_location(img, file$7, 7, 2, 182);
    			add_location(strong, file$7, 9, 4, 334);
    			attr_dev(h3, "class", " mb-1 mt-1 text text--dark text--section text--section--text text--center");
    			add_location(h3, file$7, 8, 2, 242);
    			attr_dev(p, "class", "text text--gray text--section text--section--text text--center");
    			add_location(p, file$7, 11, 2, 371);
    			attr_dev(div, "class", "container--flex container--flex--column");
    			add_location(div, file$7, 6, 0, 125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, h3);
    			append_dev(h3, strong);
    			append_dev(strong, t1);
    			append_dev(div, t2);
    			append_dev(div, p);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*icon*/ 4 && img.src !== (img_src_value = `assets/img/icons/${/*icon*/ ctx[2]}.svg`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*title*/ 1) {
    				attr_dev(img, "alt", /*title*/ ctx[0]);
    			}

    			if (dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);
    			if (dirty & /*text*/ 2) set_data_dev(t3, /*text*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Feature", slots, []);
    	let { title = "Default title" } = $$props;
    	let { text = "Default text" } = $$props;
    	let { icon } = $$props;
    	const writable_props = ["title", "text", "icon"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Feature> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("text" in $$props) $$invalidate(1, text = $$props.text);
    		if ("icon" in $$props) $$invalidate(2, icon = $$props.icon);
    	};

    	$$self.$capture_state = () => ({ title, text, icon });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("text" in $$props) $$invalidate(1, text = $$props.text);
    		if ("icon" in $$props) $$invalidate(2, icon = $$props.icon);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, text, icon];
    }

    class Feature extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { title: 0, text: 1, icon: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Feature",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[2] === undefined && !("icon" in props)) {
    			console.warn("<Feature> was created without expected prop 'icon'");
    		}
    	}

    	get title() {
    		throw new Error("<Feature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Feature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Feature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Feature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Feature>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Feature>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\sections\FirstSection.svelte generated by Svelte v3.38.2 */
    const file$6 = "src\\components\\sections\\FirstSection.svelte";

    function create_fragment$6(ctx) {
    	let section;
    	let div4;
    	let h2;
    	let t1;
    	let p;
    	let t3;
    	let div3;
    	let div0;
    	let feature0;
    	let t4;
    	let div1;
    	let feature1;
    	let t5;
    	let div2;
    	let feature2;
    	let current;

    	feature0 = new Feature({
    			props: {
    				title: "Monitoring 24/7",
    				icon: "planning",
    				text: "Lorem ipsum dolor sit amet, consectetur adipis cing elit. Elementum nisi aliquet volutpat."
    			},
    			$$inline: true
    		});

    	feature1 = new Feature({
    			props: {
    				title: "Widget System",
    				icon: "computer",
    				text: "Sapien in etiam vitae nibh nunc mattis imperdiet sed nullam. Vitae et, tortor pulvinar risus pulvinar."
    			},
    			$$inline: true
    		});

    	feature2 = new Feature({
    			props: {
    				title: "Best performance",
    				icon: "speed",
    				text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum nisi aliquet volutpat."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			div4 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Main features";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum nisi aliquet volutpat pellentesque volutpat est. Sapien in etiam vitae nibh nunc mattis imperdiet sed nullam. Vitae et, tortor pulvinar risus pulvinar sit amet. Id vel in nam malesuada.";
    			t3 = space();
    			div3 = element("div");
    			div0 = element("div");
    			create_component(feature0.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			create_component(feature1.$$.fragment);
    			t5 = space();
    			div2 = element("div");
    			create_component(feature2.$$.fragment);
    			attr_dev(h2, "class", "text text--dark text--section text--section--title text--center");
    			add_location(h2, file$6, 6, 4, 140);
    			attr_dev(p, "class", "text text--gray text--section text--section--text text--center");
    			add_location(p, file$6, 9, 4, 254);
    			attr_dev(div0, "class", "grid__item");
    			add_location(div0, file$6, 13, 6, 645);
    			attr_dev(div1, "class", "grid__item");
    			add_location(div1, file$6, 20, 6, 892);
    			attr_dev(div2, "class", "grid__item");
    			add_location(div2, file$6, 27, 6, 1149);
    			attr_dev(div3, "class", "grid grid--columns3");
    			add_location(div3, file$6, 12, 4, 604);
    			attr_dev(div4, "class", "section__first");
    			add_location(div4, file$6, 5, 2, 106);
    			attr_dev(section, "class", "section");
    			add_location(section, file$6, 4, 0, 77);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div4);
    			append_dev(div4, h2);
    			append_dev(div4, t1);
    			append_dev(div4, p);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			mount_component(feature0, div0, null);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			mount_component(feature1, div1, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			mount_component(feature2, div2, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(feature0.$$.fragment, local);
    			transition_in(feature1.$$.fragment, local);
    			transition_in(feature2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(feature0.$$.fragment, local);
    			transition_out(feature1.$$.fragment, local);
    			transition_out(feature2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(feature0);
    			destroy_component(feature1);
    			destroy_component(feature2);
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

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FirstSection", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FirstSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Feature });
    	return [];
    }

    class FirstSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FirstSection",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\sections\components\FeatureItem.svelte generated by Svelte v3.38.2 */

    const file$5 = "src\\components\\sections\\components\\FeatureItem.svelte";

    // (13:4) {:else}
    function create_else_block_1(ctx) {
    	let h3;
    	let t0;
    	let t1;
    	let p;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			p = element("p");
    			t2 = text(/*text*/ ctx[2]);
    			attr_dev(h3, "class", "text text--dark text--section text--section--title text--center--sm");
    			add_location(h3, file$5, 13, 4, 403);
    			attr_dev(p, "class", "text text--gray text--section text--section--text text--center--sm");
    			add_location(p, file$5, 18, 4, 528);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			if (dirty & /*text*/ 4) set_data_dev(t2, /*text*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(13:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (9:4) {#if reverse}
    function create_if_block_1(ctx) {
    	let div;
    	let img_1;
    	let img_1_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img_1 = element("img");
    			if (img_1.src !== (img_1_src_value = `assets/img/${/*img*/ ctx[1]}.svg`)) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "class", "cardimg__img");
    			attr_dev(img_1, "alt", /*title*/ ctx[0]);
    			add_location(img_1, file$5, 10, 12, 298);
    			attr_dev(div, "class", "cardimg");
    			add_location(div, file$5, 9, 8, 263);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*img*/ 2 && img_1.src !== (img_1_src_value = `assets/img/${/*img*/ ctx[1]}.svg`)) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (dirty & /*title*/ 1) {
    				attr_dev(img_1, "alt", /*title*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(9:4) {#if reverse}",
    		ctx
    	});

    	return block;
    }

    // (31:4) {:else}
    function create_else_block(ctx) {
    	let h3;
    	let t0;
    	let t1;
    	let p;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			p = element("p");
    			t2 = text(/*text*/ ctx[2]);
    			attr_dev(h3, "class", "text text--dark text--section text--section--title text--center--sm");
    			add_location(h3, file$5, 31, 4, 862);
    			attr_dev(p, "class", "text text--gray text--section text--section--text text--center--sm");
    			add_location(p, file$5, 36, 4, 987);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			if (dirty & /*text*/ 4) set_data_dev(t2, /*text*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(31:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:4) {#if !reverse}
    function create_if_block$1(ctx) {
    	let div;
    	let img_1;
    	let img_1_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img_1 = element("img");
    			if (img_1.src !== (img_1_src_value = `assets/img/${/*img*/ ctx[1]}.svg`)) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "class", "cardimg__img");
    			attr_dev(img_1, "alt", /*title*/ ctx[0]);
    			add_location(img_1, file$5, 28, 12, 757);
    			attr_dev(div, "class", "cardimg");
    			add_location(div, file$5, 27, 8, 722);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*img*/ 2 && img_1.src !== (img_1_src_value = `assets/img/${/*img*/ ctx[1]}.svg`)) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (dirty & /*title*/ 1) {
    				attr_dev(img_1, "alt", /*title*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(27:4) {#if !reverse}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let article;
    	let div0;
    	let t;
    	let div1;

    	function select_block_type(ctx, dirty) {
    		if (/*reverse*/ ctx[3]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*reverse*/ ctx[3]) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			article = element("article");
    			div0 = element("div");
    			if_block0.c();
    			t = space();
    			div1 = element("div");
    			if_block1.c();
    			attr_dev(div0, "class", "grid__item");
    			add_location(div0, file$5, 7, 2, 210);
    			attr_dev(div1, "class", "grid__item");
    			add_location(div1, file$5, 25, 2, 668);
    			attr_dev(article, "class", "grid grid--columns2");
    			add_location(article, file$5, 6, 0, 169);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div0);
    			if_block0.m(div0, null);
    			append_dev(article, t);
    			append_dev(article, div1);
    			if_block1.m(div1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if_block0.d();
    			if_block1.d();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FeatureItem", slots, []);
    	let { title = "Default title" } = $$props;
    	let { img = "chart1" } = $$props;
    	let { text = "Some default text" } = $$props;
    	let { reverse = false } = $$props;
    	const writable_props = ["title", "img", "text", "reverse"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FeatureItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("img" in $$props) $$invalidate(1, img = $$props.img);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("reverse" in $$props) $$invalidate(3, reverse = $$props.reverse);
    	};

    	$$self.$capture_state = () => ({ title, img, text, reverse });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("img" in $$props) $$invalidate(1, img = $$props.img);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("reverse" in $$props) $$invalidate(3, reverse = $$props.reverse);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, img, text, reverse];
    }

    class FeatureItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { title: 0, img: 1, text: 2, reverse: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FeatureItem",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get title() {
    		throw new Error("<FeatureItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<FeatureItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get img() {
    		throw new Error("<FeatureItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<FeatureItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<FeatureItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<FeatureItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reverse() {
    		throw new Error("<FeatureItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reverse(value) {
    		throw new Error("<FeatureItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\sections\FeaturesList.svelte generated by Svelte v3.38.2 */
    const file$4 = "src\\components\\sections\\FeaturesList.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let featureitem0;
    	let t0;
    	let featureitem1;
    	let t1;
    	let featureitem2;
    	let current;

    	featureitem0 = new FeatureItem({
    			props: {
    				title: "Automated Reports & Widget Alerts",
    				img: "chart1",
    				text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum nisi\r\n    aliquet volutpat pellentesque volutpat est. Sapien in etiam vitae nibh\r\n    nunc mattis imperdiet sed nullam."
    			},
    			$$inline: true
    		});

    	featureitem1 = new FeatureItem({
    			props: {
    				title: "Fully customizable to address your needs ",
    				img: "chart2",
    				text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum nisi\r\n    aliquet volutpat pellentesque volutpat est. Sapien in etiam vitae nibh\r\n    nunc mattis imperdiet sed nullam.",
    				reverse: true
    			},
    			$$inline: true
    		});

    	featureitem2 = new FeatureItem({
    			props: {
    				title: "Pre-built Dashboard Templates",
    				img: "calendar",
    				text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum nisi\r\n    aliquet volutpat pellentesque volutpat est. Sapien in etiam vitae nibh\r\n    nunc mattis imperdiet sed nullam."
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(featureitem0.$$.fragment);
    			t0 = space();
    			create_component(featureitem1.$$.fragment);
    			t1 = space();
    			create_component(featureitem2.$$.fragment);
    			attr_dev(div, "class", "section");
    			add_location(div, file$4, 4, 0, 85);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(featureitem0, div, null);
    			append_dev(div, t0);
    			mount_component(featureitem1, div, null);
    			append_dev(div, t1);
    			mount_component(featureitem2, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(featureitem0.$$.fragment, local);
    			transition_in(featureitem1.$$.fragment, local);
    			transition_in(featureitem2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(featureitem0.$$.fragment, local);
    			transition_out(featureitem1.$$.fragment, local);
    			transition_out(featureitem2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(featureitem0);
    			destroy_component(featureitem1);
    			destroy_component(featureitem2);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FeaturesList", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FeaturesList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ FeatureItem });
    	return [];
    }

    class FeaturesList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FeaturesList",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\footer\PricingCard.svelte generated by Svelte v3.38.2 */

    const file$3 = "src\\components\\footer\\PricingCard.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let h4;
    	let strong0;
    	let t0;
    	let t1;
    	let small;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let hr;
    	let t6;
    	let strong1;
    	let span0;
    	let t8;
    	let span1;
    	let t10;
    	let button;
    	let t11;
    	let button_class_value;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h4 = element("h4");
    			strong0 = element("strong");
    			t0 = text(/*planName*/ ctx[1]);
    			t1 = space();
    			small = element("small");
    			t2 = text("Up to ");
    			t3 = text(/*users*/ ctx[2]);
    			t4 = text(" users");
    			t5 = space();
    			hr = element("hr");
    			t6 = space();
    			strong1 = element("strong");
    			span0 = element("span");
    			span0.textContent = "$";
    			t8 = space();
    			span1 = element("span");
    			span1.textContent = "29";
    			t10 = space();
    			button = element("button");
    			t11 = text("Order here");
    			add_location(strong0, file$3, 8, 4, 234);
    			attr_dev(h4, "class", "text card__text text--center ");
    			add_location(h4, file$3, 7, 2, 186);
    			attr_dev(small, "class", "text text--gray card__small");
    			add_location(small, file$3, 10, 2, 274);
    			attr_dev(hr, "class", "card__divider text--gray");
    			add_location(hr, file$3, 11, 2, 348);
    			attr_dev(span0, "class", "text card__price__sign");
    			add_location(span0, file$3, 13, 4, 425);
    			attr_dev(span1, "class", "text card__price__number");
    			add_location(span1, file$3, 14, 4, 476);
    			attr_dev(strong1, "class", "card__price");
    			add_location(strong1, file$3, 12, 2, 391);

    			attr_dev(button, "class", button_class_value = `button button--block mt-2 ${/*isWhite*/ ctx[0]
			? "button--primary"
			: "button--secondary button--secondary--outline"}`);

    			add_location(button, file$3, 16, 2, 541);
    			attr_dev(div, "class", div_class_value = `card ${/*isWhite*/ ctx[0] ? "card--white" : "card--dark"}`);
    			add_location(div, file$3, 6, 0, 120);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h4);
    			append_dev(h4, strong0);
    			append_dev(strong0, t0);
    			append_dev(div, t1);
    			append_dev(div, small);
    			append_dev(small, t2);
    			append_dev(small, t3);
    			append_dev(small, t4);
    			append_dev(div, t5);
    			append_dev(div, hr);
    			append_dev(div, t6);
    			append_dev(div, strong1);
    			append_dev(strong1, span0);
    			append_dev(strong1, t8);
    			append_dev(strong1, span1);
    			append_dev(div, t10);
    			append_dev(div, button);
    			append_dev(button, t11);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*planName*/ 2) set_data_dev(t0, /*planName*/ ctx[1]);
    			if (dirty & /*users*/ 4) set_data_dev(t3, /*users*/ ctx[2]);

    			if (dirty & /*isWhite*/ 1 && button_class_value !== (button_class_value = `button button--block mt-2 ${/*isWhite*/ ctx[0]
			? "button--primary"
			: "button--secondary button--secondary--outline"}`)) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty & /*isWhite*/ 1 && div_class_value !== (div_class_value = `card ${/*isWhite*/ ctx[0] ? "card--white" : "card--dark"}`)) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	validate_slots("PricingCard", slots, []);
    	let { isWhite = false } = $$props;
    	let { planName = "Default plan" } = $$props;
    	let { users = 1 } = $$props;
    	const writable_props = ["isWhite", "planName", "users"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PricingCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("isWhite" in $$props) $$invalidate(0, isWhite = $$props.isWhite);
    		if ("planName" in $$props) $$invalidate(1, planName = $$props.planName);
    		if ("users" in $$props) $$invalidate(2, users = $$props.users);
    	};

    	$$self.$capture_state = () => ({ isWhite, planName, users });

    	$$self.$inject_state = $$props => {
    		if ("isWhite" in $$props) $$invalidate(0, isWhite = $$props.isWhite);
    		if ("planName" in $$props) $$invalidate(1, planName = $$props.planName);
    		if ("users" in $$props) $$invalidate(2, users = $$props.users);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isWhite, planName, users];
    }

    class PricingCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { isWhite: 0, planName: 1, users: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PricingCard",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get isWhite() {
    		throw new Error("<PricingCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isWhite(value) {
    		throw new Error("<PricingCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get planName() {
    		throw new Error("<PricingCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set planName(value) {
    		throw new Error("<PricingCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get users() {
    		throw new Error("<PricingCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set users(value) {
    		throw new Error("<PricingCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\footer\Footer.svelte generated by Svelte v3.38.2 */
    const file$2 = "src\\components\\footer\\Footer.svelte";

    function create_fragment$2(ctx) {
    	let footer;
    	let section1;
    	let h3;
    	let t1;
    	let p;
    	let t3;
    	let section0;
    	let div1;
    	let div0;
    	let pricingcard0;
    	let t4;
    	let div3;
    	let div2;
    	let pricingcard1;
    	let t5;
    	let div5;
    	let div4;
    	let pricingcard2;
    	let t6;
    	let section2;
    	let hr;
    	let t7;
    	let div6;
    	let span;
    	let img0;
    	let img0_src_value;
    	let t8;
    	let navlist;
    	let t9;
    	let ul;
    	let li0;
    	let a0;
    	let img1;
    	let img1_src_value;
    	let t10;
    	let li1;
    	let a1;
    	let img2;
    	let img2_src_value;
    	let t11;
    	let li2;
    	let a2;
    	let img3;
    	let img3_src_value;
    	let current;

    	pricingcard0 = new PricingCard({
    			props: { planName: "Starter", users: 99 },
    			$$inline: true
    		});

    	pricingcard1 = new PricingCard({
    			props: {
    				isWhite: true,
    				planName: "Standar",
    				users: 300
    			},
    			$$inline: true
    		});

    	pricingcard2 = new PricingCard({
    			props: { planName: "Premium", users: 200 },
    			$$inline: true
    		});

    	navlist = new NavList({ props: { footer: true }, $$inline: true });

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			section1 = element("section");
    			h3 = element("h3");
    			h3.textContent = "Pricing plans";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Lorem, ipsum dolor sit amet, consectetur adipisicing elit. Eveniet sed doloribus voluptas, atque aspernatur recusandae culpa repellat natus, beatae suscipit ex, quod, quibusdam eaque ab soluta officiis asperiores porro doloremque.";
    			t3 = space();
    			section0 = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(pricingcard0.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");
    			create_component(pricingcard1.$$.fragment);
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");
    			create_component(pricingcard2.$$.fragment);
    			t6 = space();
    			section2 = element("section");
    			hr = element("hr");
    			t7 = space();
    			div6 = element("div");
    			span = element("span");
    			img0 = element("img");
    			t8 = space();
    			create_component(navlist.$$.fragment);
    			t9 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			img1 = element("img");
    			t10 = space();
    			li1 = element("li");
    			a1 = element("a");
    			img2 = element("img");
    			t11 = space();
    			li2 = element("li");
    			a2 = element("a");
    			img3 = element("img");
    			attr_dev(h3, "class", "text text--white text--title text--center mt-5");
    			add_location(h3, file$2, 7, 4, 201);
    			attr_dev(p, "class", "text text--gray text--center text--lineheight");
    			add_location(p, file$2, 10, 4, 298);
    			attr_dev(div0, "class", "container--flex container--flex--column");
    			add_location(div0, file$2, 15, 8, 688);
    			attr_dev(div1, "class", "grid__item");
    			add_location(div1, file$2, 14, 6, 654);
    			attr_dev(div2, "class", "container--flex container--flex--column");
    			add_location(div2, file$2, 20, 8, 870);
    			attr_dev(div3, "class", "grid__item");
    			add_location(div3, file$2, 19, 6, 836);
    			attr_dev(div4, "class", "container--flex container--flex--column");
    			add_location(div4, file$2, 25, 8, 1068);
    			attr_dev(div5, "class", "grid__item");
    			add_location(div5, file$2, 24, 6, 1034);
    			attr_dev(section0, "class", "grid grid--columns3");
    			add_location(section0, file$2, 13, 4, 609);
    			attr_dev(section1, "class", "section section--default");
    			add_location(section1, file$2, 6, 2, 153);
    			attr_dev(hr, "class", "card__divider text--gray");
    			add_location(hr, file$2, 33, 4, 1293);
    			if (img0.src !== (img0_src_value = "assets/img/logo2.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "logo__img");
    			attr_dev(img0, "alt", "Logo");
    			add_location(img0, file$2, 36, 8, 1404);
    			attr_dev(span, "class", "logo");
    			add_location(span, file$2, 35, 6, 1375);
    			if (img1.src !== (img1_src_value = "assets/img/icons/facebook.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Instagram");
    			add_location(img1, file$2, 42, 12, 1661);
    			attr_dev(a0, "class", "nav__list__item__link");
    			add_location(a0, file$2, 41, 10, 1614);
    			attr_dev(li0, "class", "nav__list__item");
    			add_location(li0, file$2, 40, 8, 1574);
    			if (img2.src !== (img2_src_value = "assets/img/icons/twitter.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Instagram");
    			add_location(img2, file$2, 47, 12, 1848);
    			attr_dev(a1, "class", "nav__list__item__link");
    			add_location(a1, file$2, 46, 10, 1801);
    			attr_dev(li1, "class", "nav__list__item");
    			add_location(li1, file$2, 45, 8, 1761);
    			if (img3.src !== (img3_src_value = "assets/img/icons/instagram.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Instagram");
    			add_location(img3, file$2, 52, 12, 2034);
    			attr_dev(a2, "class", "nav__list__item__link");
    			add_location(a2, file$2, 51, 10, 1987);
    			attr_dev(li2, "class", "nav__list__item");
    			add_location(li2, file$2, 50, 8, 1947);
    			attr_dev(ul, "class", "nav__list nav__list--footer");
    			add_location(ul, file$2, 39, 6, 1524);
    			attr_dev(div6, "class", "container--flex");
    			add_location(div6, file$2, 34, 4, 1338);
    			attr_dev(section2, "class", "section section--default");
    			add_location(section2, file$2, 32, 2, 1245);
    			attr_dev(footer, "class", "footer");
    			add_location(footer, file$2, 5, 0, 126);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, section1);
    			append_dev(section1, h3);
    			append_dev(section1, t1);
    			append_dev(section1, p);
    			append_dev(section1, t3);
    			append_dev(section1, section0);
    			append_dev(section0, div1);
    			append_dev(div1, div0);
    			mount_component(pricingcard0, div0, null);
    			append_dev(section0, t4);
    			append_dev(section0, div3);
    			append_dev(div3, div2);
    			mount_component(pricingcard1, div2, null);
    			append_dev(section0, t5);
    			append_dev(section0, div5);
    			append_dev(div5, div4);
    			mount_component(pricingcard2, div4, null);
    			append_dev(footer, t6);
    			append_dev(footer, section2);
    			append_dev(section2, hr);
    			append_dev(section2, t7);
    			append_dev(section2, div6);
    			append_dev(div6, span);
    			append_dev(span, img0);
    			append_dev(div6, t8);
    			mount_component(navlist, div6, null);
    			append_dev(div6, t9);
    			append_dev(div6, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(a0, img1);
    			append_dev(ul, t10);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(a1, img2);
    			append_dev(ul, t11);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(a2, img3);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pricingcard0.$$.fragment, local);
    			transition_in(pricingcard1.$$.fragment, local);
    			transition_in(pricingcard2.$$.fragment, local);
    			transition_in(navlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pricingcard0.$$.fragment, local);
    			transition_out(pricingcard1.$$.fragment, local);
    			transition_out(pricingcard2.$$.fragment, local);
    			transition_out(navlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			destroy_component(pricingcard0);
    			destroy_component(pricingcard1);
    			destroy_component(pricingcard2);
    			destroy_component(navlist);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ PricingCard, NavList });
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\layouts\Edition.svelte generated by Svelte v3.38.2 */
    const file$1 = "src\\components\\layouts\\Edition.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let span;
    	let i0;
    	let t1;
    	let div1;
    	let ul;
    	let li0;
    	let button0;
    	let i1;
    	let t2;
    	let li1;
    	let button1;
    	let i2;
    	let t3;
    	let li2;
    	let button2;
    	let i3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "You are on edition mood";
    			i0 = element("i");
    			t1 = space();
    			div1 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			i1 = element("i");
    			t2 = space();
    			li1 = element("li");
    			button1 = element("button");
    			i2 = element("i");
    			t3 = space();
    			li2 = element("li");
    			button2 = element("button");
    			i3 = element("i");
    			attr_dev(span, "class", "mr-2");
    			add_location(span, file$1, 11, 4, 233);
    			attr_dev(i0, "class", "fa fa-edit");
    			add_location(i0, file$1, 11, 53, 282);
    			attr_dev(div0, "class", "edit__bottom");
    			add_location(div0, file$1, 10, 2, 201);
    			attr_dev(i1, "class", "fa fa-save");
    			add_location(i1, file$1, 17, 10, 518);
    			attr_dev(button0, "class", "edit__side__list__item__button");
    			add_location(button0, file$1, 16, 8, 432);
    			attr_dev(li0, "class", "edit__side__list__item");
    			add_location(li0, file$1, 15, 6, 387);
    			attr_dev(i2, "class", "fa fa-edit");
    			add_location(i2, file$1, 22, 10, 686);
    			attr_dev(button1, "class", "edit__side__list__item__button");
    			add_location(button1, file$1, 21, 8, 627);
    			attr_dev(li1, "class", "edit__side__list__item");
    			add_location(li1, file$1, 20, 6, 582);
    			attr_dev(i3, "class", "fa fa-times");
    			add_location(i3, file$1, 27, 10, 881);
    			attr_dev(button2, "class", "edit__side__list__item__button");
    			add_location(button2, file$1, 26, 8, 795);
    			attr_dev(li2, "class", "edit__side__list__item");
    			add_location(li2, file$1, 25, 6, 750);
    			attr_dev(ul, "class", "edit__side__list");
    			add_location(ul, file$1, 14, 4, 350);
    			attr_dev(div1, "class", "edit__side");
    			add_location(div1, file$1, 13, 2, 320);
    			attr_dev(div2, "class", "edit");
    			add_location(div2, file$1, 9, 0, 179);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, span);
    			append_dev(div0, i0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(button0, i1);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    			append_dev(button1, i2);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, button2);
    			append_dev(button2, i3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handleSaveEvent*/ ctx[0], false, false, false),
    					listen_dev(button2, "click", /*handleSaveEvent*/ ctx[0], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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
    	validate_slots("Edition", slots, []);
    	const dispatch = createEventDispatcher();

    	const handleSaveEvent = () => {
    		dispatch("save");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Edition> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		handleSaveEvent
    	});

    	return [handleSaveEvent];
    }

    class Edition extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Edition",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const data = {
      h1: [],
      h2: [],
      h3: [],
      p: [],
    };

    const setElementsToEdit = () => {
        const p = document.querySelectorAll("p");
        data.p.length = p.length;
        const h1 = document.querySelectorAll("h1");
        data.h1.length = h1.length;
        const h2 = document.querySelectorAll("h2");
        data.h2.length = h2.length;
        const h3 = document.querySelectorAll("h3");
        data.h3.length = h3.length;
        
        return {p, h1, h2, h3}
      };

      const getInputElements = () => {
        const p = document.querySelectorAll('.edit-p');
        const h1 = document.querySelectorAll('.edit-h1');
        const h2 = document.querySelectorAll('.edit-h2');
        const h3 = document.querySelectorAll('.edit-h3');
        return {p, h1, h2, h3}
      };

      const elementsToTextArea = (elementsArray, tag) => {
        elementsArray.forEach((el, index) => {
          const newEl = document.createElement("textarea");
          newEl.value = el.textContent;
          data[tag][index] = newEl.value;
          newEl.classList.add(...el.classList, 'edit-input', `edit-${tag}`);
          el.parentNode.replaceChild(newEl, el);
        });
      };

       

      const inputsToElement = (inputsArray, tag) => {
        inputsArray.forEach((el, index) => {
            const newEl = document.createElement(tag);
            newEl.classList.add(...el.classList);
            newEl.classList.remove('edit-input', `edit-${tag}`);
            if(inputsArray[index].value) newEl.textContent = inputsArray[index].value;
            else newEl.textContent = 'Default text';
            data[tag][index] = inputsArray[index].value;
            el.parentNode.replaceChild(newEl, el);
        });
      };

    /* src\App.svelte generated by Svelte v3.38.2 */

    const file = "src\\App.svelte";

    // (47:2) {#if editableState}
    function create_if_block(ctx) {
    	let edition;
    	let current;
    	edition = new Edition({ $$inline: true });
    	edition.$on("save", /*save*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(edition.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(edition, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(edition.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(edition.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(edition, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(47:2) {#if editableState}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let t0;
    	let header;
    	let t1;
    	let main;
    	let firstsection;
    	let t2;
    	let featureslist;
    	let t3;
    	let footer;
    	let current;
    	let if_block = /*editableState*/ ctx[0] && create_if_block(ctx);
    	header = new Header({ $$inline: true });
    	firstsection = new FirstSection({ $$inline: true });
    	featureslist = new FeaturesList({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			main = element("main");
    			create_component(firstsection.$$.fragment);
    			t2 = space();
    			create_component(featureslist.$$.fragment);
    			t3 = space();
    			create_component(footer.$$.fragment);
    			add_location(main, file, 51, 2, 1407);
    			attr_dev(div, "class", "main-wrapper");
    			add_location(div, file, 45, 0, 1302);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			mount_component(header, div, null);
    			append_dev(div, t1);
    			append_dev(div, main);
    			mount_component(firstsection, main, null);
    			append_dev(main, t2);
    			mount_component(featureslist, main, null);
    			append_dev(div, t3);
    			mount_component(footer, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*editableState*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*editableState*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(header.$$.fragment, local);
    			transition_in(firstsection.$$.fragment, local);
    			transition_in(featureslist.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(header.$$.fragment, local);
    			transition_out(firstsection.$$.fragment, local);
    			transition_out(featureslist.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_component(header);
    			destroy_component(firstsection);
    			destroy_component(featureslist);
    			destroy_component(footer);
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
    	let editableState = false;

    	//To prevent the default action
    	document.body.addEventListener("keydown", event => {
    		if (event.ctrlKey && ("k").indexOf(event.key) !== -1) {
    			event.preventDefault();
    		}
    	});

    	document.onkeyup = function (e) {
    		if (e.ctrlKey && e.keyCode == 75) {
    			if (editableState) save(); else {
    				$$invalidate(0, editableState = true);
    				const { p, h1, h2, h3 } = setElementsToEdit();
    				elementsToTextArea(p, "p");
    				elementsToTextArea(h1, "h1");
    				elementsToTextArea(h2, "h2");
    				elementsToTextArea(h3, "h3");
    			}
    		}
    	};

    	const save = () => {
    		$$invalidate(0, editableState = false);
    		const { p, h1, h2, h3 } = getInputElements();
    		inputsToElement(p, "p");
    		inputsToElement(h1, "h1");
    		inputsToElement(h2, "h2");
    		inputsToElement(h3, "h3");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		FirstSection,
    		FeaturesList,
    		Footer,
    		Edition,
    		setElementsToEdit,
    		getInputElements,
    		elementsToTextArea,
    		inputsToElement,
    		editableState,
    		save
    	});

    	$$self.$inject_state = $$props => {
    		if ("editableState" in $$props) $$invalidate(0, editableState = $$props.editableState);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [editableState, save];
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
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
