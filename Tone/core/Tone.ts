/// <
/**
 *  Tone.js
 *  @author Yotam Mann
 *  @license http://opensource.org/licenses/MIT MIT License
 *  @copyright 2014-2018 Yotam Mann
 */

	///////////////////////////////////////////////////////////////////////////
	//	TONE
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  @class  Tone is the base class of all other classes.
	 *  @constructor
	 */
class Tone {
	debug?: boolean;
	static Param: any;
	static Signal: any;
	static Context: any;
	static TimeBase: any;

	constructor(){
		if (!(this instanceof Tone)){
			throw new Error("constructor needs to be called with the 'new' keyword");
		}
	};

	/**
	 *  @memberOf Tone#
	 *  @returns {String} returns the name of the class as a string
	 */
	toString(): string {
		for (var className in Tone){
			var isLetter = className[0].match(/^[A-Z]$/);
			var sameConstructor = Tone[className] === this.constructor;
			if (Tone.isFunction(Tone[className]) && isLetter && sameConstructor){
				return className;
			}
		}
		return "Tone";
	}

	/**
	 *  @memberOf Tone#
	 *  disconnect and dispose
	 *  @returns {Tone} this
	 */
	dispose(): Tone {
		return this;
	}

	///////////////////////////////////////////////////////////////////////////
	//	GET/SET
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Set the parameters at once. Either pass in an
	 *  object mapping parameters to values, or to set a
	 *  single parameter, by passing in a string and value.
	 *  The last argument is an optional ramp time which
	 *  will ramp any signal values to their destination value
	 *  over the duration of the rampTime.
	 *  @param {Object|String} _param
	 *  @param {Number=} value
	 *  @param {Time=} rampTime
	 *  @returns {Tone} this
	 *  @memberOf Tone#
	 *  @example
	 * //set values using an object
	 * filter.set({
	 * 	"frequency" : 300,
	 * 	"type" : highpass
	 * });
	 *  @example
	 * filter.set("type", "highpass");
	 *  @example
	 * //ramp to the value 220 over 3 seconds.
	 * oscillator.set({
	 * 	"frequency" : 220
	 * }, 3);
	 */
	set(_param: Object | string, value?: number, rampTime?: number): Tone {
		const params = typeof _param === 'string'
			? { [_param]: value }
			: _param
		;

		if (Tone.isObject(params)){
			rampTime = value;
		}

		paramLoop:
		for (var attr in params){
			value = params[attr];
			var parent = this;
			if (attr.indexOf(".") !== -1){
				var attrSplit = attr.split(".");
				for (var i = 0; i < attrSplit.length - 1; i++){
					parent = parent[attrSplit[i]];
					if (parent instanceof Tone){
						attrSplit.splice(0, i+1);
						var innerParam = attrSplit.join(".");
						parent.set(innerParam, value);
						continue paramLoop;
					}
				}
				attr = attrSplit[attrSplit.length - 1];
			}
			var param = parent[attr];
			if (Tone.isUndef(param)){
				continue;
			}
			if ((Tone.Signal && param instanceof Tone.Signal) ||
					(Tone.Param && param instanceof Tone.Param)){
				if (param.value !== value){
					if (Tone.isUndef(rampTime)){
						param.value = value;
					} else {
						param.rampTo(value, rampTime);
					}
				}
			} else if (param instanceof AudioParam){
				if (param.value !== value){
					param.value = value;
				}
			} else if (Tone.TimeBase && param instanceof Tone.TimeBase){
				parent[attr] = value;
			} else if (param instanceof Tone){
				param.set(value);
			} else if (param !== value){
				parent[attr] = value;
			}
		}
		return this;
	}

	/**
	 *  Get the object's attributes. Given no arguments get
	 *  will return all available object properties and their corresponding
	 *  values. Pass in a single attribute to retrieve or an array
	 *  of attributes. The attribute strings can also include a "."
	 *  to access deeper properties.
	 *  @memberOf Tone#
	 *  @example
	 * osc.get();
	 * //returns {"type" : "sine", "frequency" : 440, ...etc}
	 *  @example
	 * osc.get("type");
	 * //returns { "type" : "sine"}
	 * @example
	 * //use dot notation to access deep properties
	 * synth.get(["envelope.attack", "envelope.release"]);
	 * //returns {"envelope" : {"attack" : 0.2, "release" : 0.4}}
	 *  @param {Array=|string|undefined} _params the parameters to get, otherwise will return
	 *  					                  all available.
	 *  @returns {Object}
	 */
	get(_params?: string[]): Object {
		let params = null;

		if (Tone.isUndef(_params)){
			params = this._collectDefaults(this.constructor);
		} else if (Tone.isString(params)){
			params = [params];
		}

		var ret = {};
		for (var i = 0; i < params.length; i++){
			var attr = params[i];
			var parent = this;
			var subRet = ret;
			if (attr.indexOf(".") !== -1){
				var attrSplit = attr.split(".");
				for (var j = 0; j < attrSplit.length - 1; j++){
					var subAttr = attrSplit[j];
					subRet[subAttr] = subRet[subAttr] || {};
					subRet = subRet[subAttr];
					parent = parent[subAttr];
				}
				attr = attrSplit[attrSplit.length - 1];
			}
			var param = parent[attr];
			if (Tone.isObject(params[attr])){
				subRet[attr] = param.get();
			} else if (Tone.Signal && param instanceof Tone.Signal){
				subRet[attr] = param.value;
			} else if (Tone.Param && param instanceof Tone.Param){
				subRet[attr] = param.value;
			} else if (param instanceof AudioParam){
				subRet[attr] = param.value;
			} else if (param instanceof Tone){
				subRet[attr] = param.get();
			} else if (!Tone.isFunction(param) && Tone.isDefined(param)){
				subRet[attr] = param;
			}
		}
		return ret;
	}

	/**
	 *  collect all of the default attributes in one
	 *  @private
	 *  @param {Function} constr the constructor to find the defaults from
	 *  @return {Array} all of the attributes which belong to the class
	 */
	private _collectDefaults(constr): string[]{
		var ret = [];
		if (Tone.isDefined(constr.defaults)){
			ret = Object.keys(constr.defaults);
		}
		if (Tone.isDefined(constr._super)){
			var superDefs = this._collectDefaults(constr._super);
			//filter out repeats
			for (var i = 0; i < superDefs.length; i++){
				if (ret.indexOf(superDefs[i]) === -1){
					ret.push(superDefs[i]);
				}
			}
		}
		return ret;
	}

	///////////////////////////////////////////////////////////////////////////
	//	DEFAULTS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  @memberOf Tone
	 *  @param  {Array}  values  The arguments array
	 *  @param  {Array}  keys    The names of the arguments
	 *  @param {Function|Object} constr The class constructor
	 *  @return  {Object}  An object composed of the  defaults between the class' defaults
	 *                        and the passed in arguments.
	 */
	static defaults(
		values: any[],
		keys: string[],
		constr: (Function | Object) & { defaults?: Object }
	): Object {
		var options = {};
		if (values.length === 1 && Tone.isObject(values[0])){
			options = values[0];
		} else {
			for (var i = 0; i < keys.length; i++){
				options[keys[i]] = values[i];
			}
		}
		if (Tone.isDefined(constr.defaults)){
			return Tone.defaultArg(options, constr.defaults);
		} else if (Tone.isObject(constr)){
			return Tone.defaultArg(options, constr);
		} else {
			return options;
		}
	}

	/**
	 *  If the `given` parameter is undefined, use the `fallback`.
	 *  If both `given` and `fallback` are object literals, it will
	 *  return a deep copy which includes all of the parameters from both
	 *  objects. If a parameter is undefined in given, it will return
	 *  the fallback property.
	 *  <br><br>
	 *  WARNING: if object is self referential, it will go into an an
	 *  infinite recursive loop.
	 *  @memberOf Tone
	 *  @param  {*} given
	 *  @param  {*} fallback
	 *  @return {*}
	 */
	static defaultArg(given, fallback){
		if (Tone.isObject(given) && Tone.isObject(fallback)){
			var ret = {};
			//make a deep copy of the given object
			for (var givenProp in given){
				ret[givenProp] = Tone.defaultArg(fallback[givenProp], given[givenProp]);
			}
			for (var fallbackProp in fallback){
				ret[fallbackProp] = Tone.defaultArg(given[fallbackProp], fallback[fallbackProp]);
			}
			return ret;
		} else {
			return Tone.isUndef(given) ? fallback : given;
		}
	}

	///////////////////////////////////////////////////////////////////////////
	//	DEBUGGING
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Print the outputs to the console log for debugging purposes.
	 *  Prints the contents only if either the object has a property
	 *  called `debug` set to true, or a variable called TONE_DEBUG_CLASS
	 *  is set to the name of the class.
	 *  @example
	 * //prints all logs originating from Tone.OscillatorNode
	 * window.TONE_DEBUG_CLASS = "OscillatorNode"
	 *  @param {*} args Any arguments to print to the console.
	 *  @private
	 */
	log(){
		//if the object is either set to debug = true
		//or if there is a string on the window with the class name
		if (this.debug || this.toString() === window.TONE_DEBUG_CLASS){
			var args = Array.from(arguments);
			args.unshift(this.toString()+":");
			// eslint-disable-next-line no-console
			console.log.apply(undefined, args);
		}
	}

	/**
	 *  Assert that the statement is true, otherwise invoke the error.
	 *  @param {Boolean} statement
	 *  @param {String} error The message which is passed into an Error
	 *  @private
	 */
	assert(statement: boolean, error: string){
		if (!statement){
			throw new Error(error);
		}
	}

	///////////////////////////////////////////////////////////////////////////
	//	CONNECTIONS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  connect together all of the arguments in series
	 *  @param {...AudioParam|Tone|AudioNode} nodes
	 *  @returns {Tone}
	 *  @memberOf Tone
	 *  @static
	 */
	static connectSeries(...args: any[]) {
		var currentUnit = args[0];

		for (var i = 1; i < args.length; i++){
			var toUnit = args[i];
			currentUnit.connect(toUnit);
			currentUnit = toUnit;
		}

		return Tone;
	}

	///////////////////////////////////////////////////////////////////////////
	// TYPE CHECKING
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Test if the arg is undefined
	 *  @param {*} arg the argument to test
	 *  @returns {Boolean} true if the arg is undefined
	 *  @static
	 *  @memberOf Tone
	 */
	static isUndef(val): boolean {
		return typeof val === "undefined";
	}

	/**
	 *  Test if the arg is not undefined
	 *  @param {*} arg the argument to test
	 *  @returns {Boolean} true if the arg is undefined
	 *  @static
	 *  @memberOf Tone
	 */
	static isDefined(val: any): boolean {
		return !Tone.isUndef(val);
	}

	/**
	 *  Test if the arg is a function
	 *  @param {*} arg the argument to test
	 *  @returns {Boolean} true if the arg is a function
	 *  @static
	 *  @memberOf Tone
	 */
	static isFunction(val): boolean {
		return typeof val === "function";
	}

	/**
	 *  Test if the argument is a number.
	 *  @param {*} arg the argument to test
	 *  @returns {Boolean} true if the arg is a number
	 *  @static
	 *  @memberOf Tone
	 */
	static isNumber(arg: any): boolean {
		return (typeof arg === "number");
	}

	/**
	 *  Test if the given argument is an object literal (i.e. `{}`);
	 *  @param {*} arg the argument to test
	 *  @returns {Boolean} true if the arg is an object literal.
	 *  @static
	 *  @memberOf Tone
	 */
	static isObject(arg: any): boolean {
		return (Object.prototype.toString.call(arg) === "[object Object]" && arg.constructor === Object);
	}

	/**
	 *  Test if the argument is a boolean.
	 *  @param {*} arg the argument to test
	 *  @returns {Boolean} true if the arg is a boolean
	 *  @static
	 *  @memberOf Tone
	 */
	static isBoolean(arg: any): boolean {
		return (typeof arg === "boolean");
	}

	/**
	 *  Test if the argument is an Array
	 *  @param {*} arg the argument to test
	 *  @returns {Boolean} true if the arg is an array
	 *  @static
	 *  @memberOf Tone
	 */
	static isArray(arg: any): boolean {
		return (Array.isArray(arg));
	}

	/**
	 *  Test if the argument is a string.
	 *  @param {*} arg the argument to test
	 *  @returns {Boolean} true if the arg is a string
	 *  @static
	 *  @memberOf Tone
	 */
	static isString(arg: any): boolean {
		return (typeof arg === "string");
	}

	/**
	 *  Test if the argument is in the form of a note in scientific pitch notation.
	 *  e.g. "C4"
	 *  @param {*} arg the argument to test
	 *  @returns {Boolean} true if the arg is a string
	 *  @static
	 *  @memberOf Tone
	 */
	static isNote(arg): boolean {
		return Tone.isString(arg) && /^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i.test(arg);
	}

	/**
	 *  An empty function.
	 *  @static
	 */
	static noOp = function(){}

	/**
	 *  Make the property not writable. Internal use only.
	 *  @private
	 *  @param  {String}  property  the property to make not writable
	 */
	private _readOnly(property: string) {
		if (Array.isArray(property)){
			for (var i = 0; i < property.length; i++){
				this._readOnly(property[i]);
			}
		} else {
			Object.defineProperty(this, property, {
				writable : false,
				enumerable : true,
			});
		}
	}

	/**
	 *  Make an attribute writeable. Interal use only.
	 *  @private
	 *  @param  {String}  property  the property to make writable
	 */
	private _writable(property: string) {
		if (Array.isArray(property)){
			for (var i = 0; i < property.length; i++){
				this._writable(property[i]);
			}
		} else {
			Object.defineProperty(this, property, {
				writable : true,
			});
		}
	}

	/**
	 * Possible play states.
	 * @enum {String}
	 */
	static State = {
		Started : "started",
		Stopped : "stopped",
		Paused : "paused",
	}

	///////////////////////////////////////////////////////////////////////////
	// CONVERSIONS
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Equal power gain scale. Good for cross-fading.
	 *  @param  {NormalRange} percent (0-1)
	 *  @return {Number}         output gain (0-1)
	 *  @static
	 *  @memberOf Tone
	 */
	static equalPowerScale(percent: number): number {
		var piFactor = 0.5 * Math.PI;
		return Math.sin(percent * piFactor);
	}

	/**
	 *  Convert decibels into gain.
	 *  @param  {Decibels} db
	 *  @return {Number}
	 *  @static
	 *  @memberOf Tone
	 */
	static dbToGain(db: number): number {
		return Math.pow(10, db / 20);
	}

	/**
	 *  Convert gain to decibels.
	 *  @param  {Number} gain (0-1)
	 *  @return {Decibels}
	 *  @static
	 *  @memberOf Tone
	 */
	static gainToDb(gain): number {
		return 20 * (Math.log(gain) / Math.LN10);
	}

	/**
	 *  Convert an interval (in semitones) to a frequency ratio.
	 *  @param  {Interval} interval the number of semitones above the base note
	 *  @return {Number}          the frequency ratio
	 *  @static
	 *  @memberOf Tone
	 *  @example
	 * tone.intervalToFrequencyRatio(0); // 1
	 * tone.intervalToFrequencyRatio(12); // 2
	 * tone.intervalToFrequencyRatio(-12); // 0.5
	 */
	static intervalToFrequencyRatio(interval) {
		return Math.pow(2, (interval/12));
	}

	///////////////////////////////////////////////////////////////////////////
	//	TIMING
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  Return the current time of the AudioContext clock plus
	 *  the lookAhead.
	 *  @return {Number} the currentTime from the AudioContext
	 *  @memberOf Tone#
	 */
	now(): number {
		return Tone.context.currentTime;
	}

	/**
	 *  Return the current time of the AudioContext clock plus
	 *  the lookAhead.
	 *  @return {Number} the currentTime from the AudioContext
	 *  @static
	 *  @memberOf Tone
	 */
	static now(): number {
		return Tone.context.currentTime;
	}

	/**
	 *  Return the current time of the AudioContext clock without
	 *  any lookAhead.
	 *  @return {Number} the currentTime from the AudioContext
	 *  @memberOf Tone#
	 */
	immediate(): number {
		return Tone.context.currentTime;
	}

	/**
	 *  Return the current time of the AudioContext clock without
	 *  any lookAhead.
	 *  @return {Number} the currentTime from the AudioContext
	 *  @memberOf Tone
	 */
	static immediate(): number {
		return Tone.context.currentTime;
	}

	///////////////////////////////////////////////////////////////////////////
	//	INHERITANCE
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  have a child inherit all of Tone's (or a parent's) prototype
	 *  to inherit the parent's properties, make sure to call
	 *  Parent.call(this) in the child's constructor
	 *
	 *  based on closure library's inherit function
	 *
	 *  @memberOf Tone
	 *  @static
	 *  @param  {Function} 	child
	 *  @param  {Function=} parent (optional) parent to inherit from
	 *                             if no parent is supplied, the child
	 *                             will inherit from Tone
	 */
	static extend(child: Function, parent?: Function) {
		if (Tone.isUndef(parent)){
			parent = Tone;
		}
		function TempConstructor(){}
		TempConstructor.prototype = parent.prototype;
		child.prototype = new TempConstructor();
		/** @override */
		child.prototype.constructor = child;
		child._super = parent;
	}

	///////////////////////////////////////////////////////////////////////////
	//	CONTEXT
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  A static pointer to the audio context accessible as Tone.context.
	 *  @type {Tone.Context}
	 *  @name context
	 *  @memberOf Tone
	 */
	static get context() {
		return window.TONE_AUDIO_CONTEXT;
	}
	static set context(context) {
		if (Tone.Context && context instanceof Tone.Context) {
			window.TONE_AUDIO_CONTEXT = context;
		} else {
			window.TONE_AUDIO_CONTEXT = new Tone.Context(context);
		}
		//initialize the new audio context
		Tone.Context.emit("init", window.TONE_AUDIO_CONTEXT);
	}

	/**
	 *  The AudioContext
	 *  @type {Tone.Context}
	 *  @name context
	 *  @memberOf Tone#
	 *  @readOnly
	 */
	get context() {
		return Tone.context;
	}

	/**
	 *  Tone automatically creates a context on init, but if you are working
	 *  with other libraries which also create an AudioContext, it can be
	 *  useful to set your own. If you are going to set your own context,
	 *  be sure to do it at the start of your code, before creating any objects.
	 *  @static
	 *  @param {AudioContext} ctx The new audio context to set
	 */
	static setContext(ctx: AudioContext){
		Tone.context = ctx;
	}

	///////////////////////////////////////////////////////////////////////////
	//	ATTRIBUTES
	///////////////////////////////////////////////////////////////////////////

	/**
	 *  The number of seconds of 1 processing block (128 samples)
	 *  @type {Number}
	 *  @name blockTime
	 *  @memberOf Tone
	 *  @static
	 *  @readOnly
	 */
	get blockTime() {
		return 128 / this.context.sampleRate;
	}

	/**
	 *  The duration in seconds of one sample.
	 *  @type {Number}
	 *  @name sampleTime
	 *  @memberOf Tone
	 *  @static
	 *  @readOnly
	 */
	get sampleTime() {
		return 1 / this.context.sampleRate;
	}

	/**
	 *  Whether or not all the technologies that Tone.js relies on are supported by the current browser.
	 *  @type {Boolean}
	 *  @name supported
	 *  @memberOf Tone
	 *  @readOnly
	 *  @static
	 */
	static get supported() {
		var hasAudioContext = window.hasOwnProperty("AudioContext") || window.hasOwnProperty("webkitAudioContext");
		var hasPromises = window.hasOwnProperty("Promise");
		return hasAudioContext && hasPromises;
	}

	/**
	 *  Boolean value if the audio context has been initialized.
	 *  @type {Boolean}
	 *  @memberOf Tone
	 *  @static
	 *  @name initialized
	 *  @readOnly
	 */
	static get initialized() {
		return Boolean(window.TONE_AUDIO_CONTEXT)
	}

	/**
	 *  Get the context when it becomes available
	 *  @param  {Function}  resolve  Callback when the context is initialized
	 *  @return  {Tone}
	 */
	static getContext(resolve){
		if (Tone.initialized){
			resolve(Tone.context);
		} else {
			var resCallback = () => {
				resolve(Tone.context);
				Tone.Context.off("init", resCallback);
			};
			Tone.Context.on("init", resCallback);
		}
		return Tone;
	}

	/**
	 * The version number
	 * @type {String}
	 * @static
	 */

	static version: string = "r13-dev";
}

export default Tone;
