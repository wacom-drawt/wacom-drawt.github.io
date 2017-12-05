// •••••••••••••• Module global functions ••••••••••••••
/**
 * This method calculates the bounds of a single segment of a path.
 * A segment is the curve between two control points.
 *
 * @method Module.calculateSegmentBounds
 * @param {Module.Int64Ptr} points
 * @param {int} stride stroke stride
 * @param {float} width stroke width
 * @param {int} index point index
 * @param {float} scattering
 * @return {Module.Rectangle}
 */
// Module.calculateSegmentBounds(points, stride, width, index, scattering);

// •••••••••••••• Module Enums ••••••••••••••
/**
 * Enum for blend modes
 *
 * @readonly
 * @enum {Object}
 * @typedef {Object} Module.BlendMode
 * @property {Object} NORMAL Standard alpha composition
 * @property {Object} NORMAL_REVERSE Like NORMAL, but the drawn layer goes at the back
 * @property {Object} ERASE The opacity (alpha) of the draw layer specify how the pixel of the target to be cleared
 * @property {Object} NONE No color mixing, the result is the layer drawn
 * @property {Object} MAX The result is the maximum of both color. The result is a lighter color.
 * @property {Object} MIN The result is the minimum of both color. The result is a darker color.
 * @property {Object} ADD Sums the color components
 * @property {Object} SUBSTRACT Subtract the destination color components from the drawn color components
 * @property {Object} SUBSTRACT_REVERSE Subtract the drawn color components from the destination color components
 * @property {Object} MULTIPLY_NO_ALPHA Plain multiplication, alpha is multiplied as well
 * @property {Object} MULTIPLY_NO_ALPHA_INVERT Equals to 1 - MULTIPLY_NO_ALPHA
 */
// Module.BlendMode;

/**
 * Enum used in Module.ParticleBrush that describes rotation of particles
 *
 * @readonly
 * @enum {Object}
 * @typedef {Object} Module.RotationMode
 * @property {Object} NONE Rotation not available
 * @property {Object} RANDOM Particle is rotated randomly around its center
 * @property {Object} TRAJECTORY Particle rotates in such a way that it follows the trajectory
 */
 // Module.RotationMode;

/**
 * Enumeration of the properties of a path, constructed by the Module.PathBuilder subclasses
 *
 * @readonly
 * @enum {Object}
 * @typedef {Object} Module.PropertyName
 * @property {Object} Width The width property of a path build by the Module.PathBuilder subclasses
 * @property {Object} Alpha The alpha (of the color) property of a path build by the Module.PathBuilder subclasses
 */
// Module.PropertyName;

/**
 * Enumeration of the properties of a path, constructed by the Module.PathBuilder subclasses
 *
 * @readonly
 * @enum {Object}
 * @typedef {Object} Module.PropertyFunction
 * @property {Object} Power The function f(x) = x^a. When a is 1.0, the function becomes f(x) = x, the identity.
 * @property {Object} Periodic
 * 	Periodic function that cycles between the minimum and maximum value. The parameter sets the number of half-cycles.
 * 	When the parameter is odd number, the function will begin with the minimum value and will finish with the maximum value.
 * 	When period is even number the function starts and finish with the same value.
 * @property {Object} Sigmoid
 * 	A sigmoid function is a function having an "S" shape. It goes from the minimum to the maximum value.
 * 	It accelerates from the start to the middle and then decelerates to the end. The parameter controls the acceleration.
 */
// Module.PropertyFunction;

/**
 * Enumeration of the input phases used by the subclasses of the Module.PathBuilder class
 *
 * @readonly
 * @enum {Object}
 * @typedef {Object} Module.InputPhase
 * @property {Object} Begin The begin phase of the input. The input has began.
 * @property {Object} Move The move phase of the input. The input has changed its position.
 * @property {Object} End The end phase of the input. The input has been completed.
 */
// Module.InputPhase;

/**
 * Enumeration of the intersection used by Module.Intersector class
 *
 * @readonly
 * @enum {Object}
 * @typedef {Object} Module.IntersectorTargetType
 * @property {Object} NONE intersection not available
 * @property {Object} STROKE intersection with 'inersector.setTargetAsStroke'
 * @property {Object} CLOSED_PATH intersection with 'inersector.setTargetAsClosedPath'
 */
// Module.IntersectorTargetType;

// •••••••••••••• Module Types (represented as JSON) ••••••••••••••
/**
 * Represents access point to HEAP.
 * Module.readBytes and Module.writeBytes operates with HEAP.
 *
 * @typedef {Object} Module.Int64Ptr
 * @property {long} ptr Pointer to the HEAP
 * @property {int} length Length of the data
 */
// Module.Int64Ptr;

/**
 * Represents color
 *
 * @typedef {Object} Module.Color
 * @property {int} red component, value between 0 and 255
 * @property {int} green component, value between 0 and 255
 * @property {int} blue component, value between 0 and 255
 * @property {float} alpha (opacity) component, value between 0 and 1
 */
// Module.Color;

/**
 * Represents rectangle
 *
 * @typedef {Object} Module.Rectangle
 * @property {float} left x coordinate
 * @property {float} top y coordinate
 * @property {float} right x + width
 * @property {float} bottom y + width
 * @property {float} width rect width
 * @property {float} height rect height
 */
// Module.Rectangle;

/**
 * Size description
 *
 * @typedef {Object} Module.Size
 * @property {float} width
 * @property {float} height
 */
// Module.Size;

/**
 * Point description
 *
 * @typedef {Object} Module.Point
 * @property {float} x coordinate
 * @property {float} y coordinate
 */
// Module.Point;

/**
 * Point2D description
 *
 * @typedef {Object} Module.Point2D
 * @property {float} x center x coordinate
 * @property {float} y center y coordinate
 * @property {float} width point width
 * @property {float} alpha point alpha
 */
// Module.Point2D;

/**
 * Represents 3x3 matrix
 *
 * <xmp>
 * 	| a  c  tx |
 * 	| b  d  ty |
 * 	| 0  0  1  |
 * </xmp>
 *
 * @typedef {Object} Module.Matrix2D
 * @property {float} a
 * @property {float} b
 * @property {float} c
 * @property {float} d
 * @property {float} tx
 * @property {float} ty
 */
// Module.Matrix2D;

/**
 * Defines WebGL context attributes
 *
 * @typedef {Object} Module.WebGLContextAttributes
 * @property {boolean} [alpha=true] If true, request an alpha channel for the context. If you create an alpha channel, you can blend the canvas rendering with the underlying web page contents.
 * @property {boolean} [depth=true] If true, request a depth buffer of at least 16 bits. If false, no depth buffer will be initialized.
 * @property {boolean} [stencil=false] If true, request a stencil buffer of at least 8 bits. If false, no stencil buffer will be initialized.
 * @property {boolean} [antialias=true] If true, antialiasing will be initialized with a browser-specified algorithm and quality level. If false, antialiasing is disabled.
 * @property {boolean} [premultipliedAlpha=true] If true, the alpha channel of the rendering context will be treated as representing premultiplied alpha values.
 * 		If false, the alpha channel represents non-premultiplied alpha.
 * @property {boolean} [preserveDrawingBuffer=false] If true, the contents of the drawing buffer are preserved between consecutive requestAnimationFrame() calls.
 *		If false, color, depth and stencil are cleared at the beginning of each requestAnimationFrame(). Generally setting this to false gives better performance.
 * @property {boolean} [preferLowPowerToHighPerformance=false] If true, hints the browser to initialize a low-power GPU rendering context.
 *		If false, prefers to initialize a high-performance rendering context.
 * @property {boolean} [failIfMajorPerformanceCaveat=false] If true, requests context creation to abort if the browser is only able to create a context
 *		that does not give good hardware-accelerated performance.
 */
// Module.WebGLContextAttributes;

/**
 * Defines blend method options
 *
 * @typedef {Object} Module.BlendOptions
 * @property {Module.BlendMode} [mode=Module.BlendMode.NORMAL] blending mode
 * @property {Module.Rectangle} [rect=source layer bounds] source area for read and destination area for write (sourceRect == destinationRect)
 * @property {Module.Rectangle} sourceRect source layer area to read, required with destinationRect
 * @property {Module.Rectangle} destinationRect destination layer area where to be drawn source layer readed data, required with sourceRect
 * @property {Module.Rectangle} clipRect blending is limited to this rect
 * @property {Module.Matrix2D} transform transformation to be applied, rects are not applicable
 */
// Module.BlendOptions;

/**
 * OffscreenLayer definition
 *
 * @typedef {Object} Module.OffscreenLayerOptions
 * @property {int} width layer width, required when user defined framebuffer or renderbuffer properties are not available or specific texture size is desired.
 * @property {int} height layer height, required when user defined Framebuffer or Renderbuffer properties are not available or specific texture size is desired.
 * @property {float} scaleFactor layer is scaled
 * @property {WebGLTexture} texture user defined texture, width and height not required when desired size matches image size and image is attached to the texture (Module.GLTools.prepareTexture attaches image).
 * @property {WebGLFramebuffer} framebuffer user defined framebuffer. When Renderbuffer not available it should be attached to the framebuffer.
 * 		When attachment is not available or attachment is not renderbuffer exception is thrown. Renderbuffer dimensions used for layer creation.
 * @property {WebGLRenderbuffer} renderbuffer user defined renderbuffer. Renderbuffer dimensions used for layer creation.
 * @property {boolean} ownGlResources if true layer will free the GL resources when deallocated, applicable when there is user defined GL resource
 */
// Module.OffscreenLayerOptions;

/**
 * Defines global Strokes configuration
 *
 * @typedef {Object} Module.StrokesConfiguration
 * @property {int} [encodePrecision=2] ink encoder/decoder parameter, describes how precise to encode paths
 * @property {boolean} [autoNormalize=false] when Module.Stroke instance is created to normalize floats (floats match after encode/decode operation)
 * @property {function} generateID function with argument stroke instance and result int, if available when Module.Stroke instance is created, property "id" will be assigned automatically
 */
// Module.StrokesConfiguration

/**
 * Defines points path
 *
 * @typedef {Object} Module.Path
 * @property {(Module.Int64Ptr | Float32Array)} points control path points
 * @property {int} stride size of each control point. It is calculated by Module.PathBuilder.
 */
// Module.Path;

/**
 * Defines stroke data
 *
 * @typedef {Object} Module.StrokeData
 * @property {Module.StrokeBrush} [brush]
 * @property {Module.Path} path
 * @property {float} [width=NaN]
 * @property {Module.Color} color
 * @property {float} [ts=0]
 * @property {float} [tf=1]
 * @property {int} [randomSeed=NaN]
 * @property {Module.BlendMode} [blendMode=Module.BlendMode.NORMAL]
 */
// Module.StrokeData;

/**
 * Defines interval of a path
 *
 * @typedef {Object} Module.Interval
 * @property {int} fromIndex
 * @property {int} toIndex
 * @property {float} fromTValue
 * @property {float} toTValue
 * @property {boolean} inside
 */
// Module.Interval;

/**
 * Defines intersection result
 *
 * @typedef {Object} Module.Split
 * @property {boolean} intersect is intersect happens
 * @property {Module.Stroke} stroke splitted stroke
 * @property {Module.Rectangle} bounds affected area
 * @property {Array<Module.Interval>} intervals substrokes input
 * @property {Array<Module.Stroke>} strokes substrokes, result from intersection
 * @property {Array<Module.Interval>} holes when intersector target type is Module.IntersectorTargetType.STROKE, inside intervals
 * @property {Array<Module.Stroke>} selected when intersector target type is Module.IntersectorTargetType.CLOSED_PATH, selected strokes
 */
// Module.Split;

/**
 * Defines serialization entity, used by Module.InkEncoder and Module.InkDecoder
 *
 * @typedef {Object} Module.InkData
 * @property {int} precision
 * @property {Module.Path} path
 * @property {float} width stroke width, NaN for strokes with variable width
 * @property {Module.Color} color stroke color, alpha channel should be NaN for strokes with variable alpha
 * @property {float} ts stroke ts
 * @property {float} tf stroke tf
 * @property {Module.UnsignedInt} randomSeed applicable only for strokes drawn with ParticleBrush, needed for StrokeDrawContext
 * @property {Module.BlendMode} blendMode how stroke should be blended with layer
 * @property {Module.UnsignedInt} [paint] used as array index, applicable when brush is type of ParticleBrush
 * @property {Module.UnsignedInt} [id] stroke identifier
 */
// Module.InkData;

/**
 * Defines composition style
 *
 * @typedef {Object} Module.ComposeStyle
 * @property {float} width stroke with, when with is dynamic should be NaN
 * @property {Module.Color} color composition color
 * @property {Module.BlendMode} blendMode layer blend mode, indicates how data should be blended
 * @property {Module.StrokeBrush} brush
 * @property {(Module.UnsignedInt | int)} [randomSeed=NaN] applicable only for ParticleBrush
 */
// Module.ComposeStyle;

// •••••••••••••• Module Wrapped Types ••••••••••••••
/**
 * Represents vector&lt;Interval&gt;
 *
 * @typedef {Object} Module.VectorInterval
 */
 // Module.VectorInterval;

 /**
 * Represents vector&lt;Int64Ptr&gt;
 *
 * @typedef {Object} Module.VectorInt64Ptr
 */
 // Module.VectorInt64Ptr;

// •#•#•#•#•#•#•#•#•#•#•#•#•#• Module Classes •#•#•#•#•#•#•#•#•#•#•#•#•#•
// •••••••••••••• Module.StrokeBrush ••••••••••••••

/**
 * Abstract, cannot be used directly. Defines how a stroke is going to be rendered.
 *
 * @class Module.StrokeBrush
 * @abstract
 * @since version 1.0
 * @param {boolean} ownTextures stroke brush owns own textures
 */
// Module.StrokeBrush(ownTextures);

/**
 * Brush blend mode
 *
 * @memberof Module.StrokeBrush.prototype
 * @member {Module.BlendMode} blendMode
 */
// Module.StrokeBrush.prototype.blendMode;

// •••••••••••••• Module.DirectBrush ••••••••••••••
/**
 * Strokes draw with this brush will be filled with a solid color
 *
 * @class Module.DirectBrush
 * @extends Module.StrokeBrush
 * @since version 1.2
 */
// Module.DirectBrush();

/**
 * Disables shape fill method antialiasing
 *
 * @method Module.DirectBrush.prototype.disableAntialiasing
 */
// Module.DirectBrush.prototype.disableAntialiasing();

// •••••••••••••• Module.SolidColorBrush ••••••••••••••
/**
 * Strokes draw with this brush will be filled with a solid color.
 * Strokes drawn with this brush are guaranteed to be rendered correctly independent of paths drawn.
 * Unlike the Module.DirectBrush, which is faster but could produce "glitches" for paths wich vary sharply in witdh.
 * This is the recommended brush for solid color strokes.
 *
 * @class Module.SolidColorBrush
 * @extends Module.DirectBrush
 * @since version 1.3
 */
// Module.SolidColorBrush();

// •••••••••••••• Module.ParticleBrush ••••••••••••••
/**
 * Strokes drawn with this brush will be drawn using a large number of small textures (called particles), scattered along the stroke's trajectory.
 * This brush is much more computational heavy compared to the Module.SolidColorBrush but it allows to create visualy expressive strokes.
 * This brush will draw a large number of small images (defined by the shapeTextureId) along the stroke's path.
 * Then they will be filled by repeating the image defined by the fillTexture.
 * The distance between the particles is controlled by the spacing property.
 * The value of the spacing must be greater than 0. Value of 1.0 means that the distance between two particles will be equal the average width of the two particles.
 * The particles could also spread out sideways. This is controlled by the scattering property.
 * Value of 0 means no spreading. Value of 1, means that the particles will spread out with a random amount between zero and one time of their width.
 * The shape texture could be rotated randomly or by trajectory.
 *
 * @class Module.ParticleBrush
 * @extends Module.StrokeBrush
 * @since version 1.2
 * @param {boolean} ownTextures stroke brush owns own textures
 */
// Module.ParticleBrush(method, ownTextures);

/**
 * @memberof Module.ParticleBrush.prototype
 * @member {boolean} randomizeFill
 */
// Module.ParticleBrush.prototype.randomizeFill

/**
 * @memberof Module.ParticleBrush.prototype
 * @member {Module.Point} fillTextureOffset
 */
// Module.ParticleBrush.prototype.fillTextureOffset

/**
 * Separation between particles
 *
 * @memberof Module.ParticleBrush.prototype
 * @member {float} spacing
 */
// Module.ParticleBrush.prototype.spacing

/**
 * Spread out sideways particles radius
 *
 * @memberof Module.ParticleBrush.prototype
 * @member {float} scattering
 */
// Module.ParticleBrush.prototype.scattering

/**
 * Particle rotation mode
 *
 * @memberof Module.ParticleBrush.prototype
 * @member {Module.RotationMode} rotationMode
 */
// Module.ParticleBrush.prototype.rotationMode

/**
 * Stroke brush shape texture.
 * This image used for each particle.
 *
 * @memberof Module.ParticleBrush.prototype
 * @member {WebGLTexture} shapeTexture
 */
// Module.ParticleBrush.prototype.shapeTexture;

/**
 * Stroke brush fill texture. This image will fill the stroke.
 * It will be repeated (tiled). Its dimension must be power of 2.
 *
 * @memberof Module.ParticleBrush.prototype
 * @member {WebGLTexture} fillTexture
 */
// Module.ParticleBrush.prototype.fillTexture;

/**
 * Configures scatter method properties
 *
 * @method Module.ParticleBrush.prototype.configure
 * @param {boolean} randomizeFill
 * @param {Module.Point} fillTextureOffset
 * @param {float} spacing separation between particles
 *		The value must be greater than 0. Value of 1.0 means that the distance between two particles will be equal the average width of the two particles.
 * @param {float} scattering Controls how much the particles will spread out sideways. Value of 0 means no spread out.
 *		Values of 1, means that each particle will be displaced sideways a random amount between 0% to 100% of its width.
 * @param {Module.RotationMode} rotationMode particle rotation mode
 */
// Module.ParticleBrush.prototype.configure(randomizeFill, fillTextureOffset, spacing, scattering, rotationMode);

/**
 * Configures shape texture. Fills texture with pixels.
 *
 * @method Module.ParticleBrush.prototype.configureShape
 * @param {(URI | Array<URI>)} src URI to an image that will be used as a pixel source or mipmap array
 * @param {Function} [callback] user defined function, executed when texture is prepared with image pixels
 * @param {Object} [context] callback context
 */
// Module.ParticleBrush.prototype.configureShape(src);

/**
 * Configures fill texture. Fills texture with pixels.
 *
 * @method Module.ParticleBrush.prototype.configureFill
 * @param {(URI | Array<URI>)} src URI to an image that will be used as a pixel source or mipmap array
 * @param {Function} [callback] user defined function, executed when texture is prepared with image pixels
 * @param {Object} [context] callback context
 */
// Module.ParticleBrush.prototype.configureFill(src);

/**
 * After texture image reading, configuration of image rect
 *
 * @method Module.ParticleBrush.prototype.setFillTextureSize
 * @param {int} width texture width
 * @param {int} height texture height
 */
// Module.ParticleBrush.prototype.setFillTextureSize(width, height);

// •••••••••••••• Module.StrokeDrawContext ••••••••••••••
/**
 * Keeps state for last point in stroke
 *
 * @class Module.StrokeDrawContext
 * @since version 1.0
 */
// Module.StrokeDrawContext();

/**
 * Random generator seed
 *
 * @memberof Module.StrokeDrawContext.prototype
 * @member {int} seed
 */
// Module.StrokeDrawContext.prototype.seed;

/**
 * Copy current context to another one
 *
 * @method Module.StrokeDrawContext.prototype.copyTo
 * @param {Module.StrokeDrawContext} drawContext copy target
 */
// Module.StrokeDrawContext.prototype.copyTo(drawContext);

// •••••••••••••• Module.OffscreenLayer ••••••••••••••
/**
 * Storage for offscreen rendering. Not constructable.
 * InkCanvas creates such layers.
 *
 * @class Module.OffscreenLayer
 * @extends Module.GenericLayer
 * @protected
 * @since version 1.3
 * @see Module.InkCanvas
 */
// Module.OffscreenLayer();

/**
 * Attached framebuffer if availble
 *
 * @memberof Module.OffscreenLayer.prototype
 * @member {WebGLFramebuffer} framebuffer
 */
// Module.OffscreenLayer.prototype.framebuffer;

/**
 * Attached renderbuffer if availble
 *
 * @memberof Module.OffscreenLayer.prototype
 * @member {WebGLRenderbuffer} renderbuffer
 */
// Module.OffscreenLayer.prototype.renderbuffer;

/**
 * Attached texture if availble. Not availble when the layer uses a renderbuffer as a storage.
 *
 * @memberof Module.OffscreenLayer.prototype
 * @member {WebGLTexture} texture
 */
// Module.OffscreenLayer.prototype.texture;

// •••••••••••••• Module.PathContext ••••••••••••••
/**
 * Contains the point produced by the path builder's append operations
 * Used only as result from addPathPart PathBuilder methods
 *
 * @class Module.PathContext
 * @since version 1.2
 */
// Module.PathContext();

/**
 * Retrieves full path points
 *
 * @method Module.PathContext.prototype.getPathPoints
 * @return {Module.Path} all the points of the path, generated from Module.PathBuilder
 */
// Module.PathContext.prototype.getPath();

/**
 * Retrieves affected path points in path from last point addition
 *
 * @method Module.PathContext.prototype.getPathPart
 * @return {Module.Path} last points from the path, added by the append operation
 */
// Module.PathContext.prototype.getPathPart();

// •••••••••••••• Module.PathBuilder ••••••••••••••
/**
 * Abstract, cannot be used directly. Class with implementation should be used.
 *
 * @class Module.PathBuilder
 * @abstract
 * @since version 1.0
 */
// Module.PathBuilder();

/**
 * Sets the movement threshold - the minimal distance between two input events.
 * The default value is 0, meaning that there is no restriction on the distance.
 * For values greater than 0, the path builder will ignore new points,
 * until the distance from the new point to the previously added point is greater than the parameter.
 *
 * @method Module.PathBuilder.prototype.setMovementThreshold
 * @param {float} minMovement the minimum movement
 */
// Module.PathBuilder.prototype.setMovementThreshold(minMovement);

/**
 * Sets the min and max values that will be used for clamping the input values.
 * Input values could be s pressure or speed, depending of the concrete class.
 *
 * @method Module.PathBuilder.prototype.setNormalizationConfig
 * @params {float} minValue
 * @params {float} maxValue
 */
// Module.PathBuilder.prototype.setNormalizationConfig(minValue, maxValue);

/**
 * Sets a property configuration. A property configuration guides the values that will be produced.
 * A property could be the  width, or the alpha of the path for each control point.
 *
 * @method Module.PathBuilder.prototype.setPropertyConfig
 * @param {Module.PropertyName} propertyName value
 * @param {float} minValue The minimum value of the property
 * @param {float} maxValue The maximum value of the property
 * @param {float} initialValue The initial value of the property
 * @param {float} finalValue The final value of the property
 * @param {Module.PropertyFunction} propertyFunction The function that will be used for path building.
 * @param {float} functionParameter The function parameter
 * @param {boolean} flip If set to true the property will be calculated in direct ratio to the normalized input value
 */
// Module.PathBuilder.prototype.setPropertyConfig(propertyName, minValue, maxValue, initialValue, finalValue, propertyFunction, functionParameter, flip);

/**
 * Disables property config
 *
 * @method Module.PathBuilder.prototype.disablePropertyConfig
 * @param {Module.PropertyName} name
 */
// Module.PathBuilder.prototype.disablePropertyConfig(name);

/**
 * Calculates the stride of the points produced by the PathBuilder.
 * The stride is the offset from one control point to the next.
 *
 * @method Module.PathBuilder.prototype.calculateStride
 * @return {int} stride
 */
// Module.PathBuilder.prototype.calculateStride();

/**
 * Adds path part
 *
 * @method Module.PathBuilder.prototype.addPathPart
 * @param {Module.Path} pathPart points from current path part
 * @return {Module.PathContext} full path and new points from input
 */
// Module.PathBuilder.prototype.addPathPart(pathPart);

/**
 * The method calculates a path part (a set of control points) without updating the path builder state.
 * This path part will behave like the path is beeing finished.
 * The returned path part can be modified by clients (for example, it can be smoothed).
 * After that the part should be passed to the 'finishPreliminaryPath' method.
 *
 * @method Module.PathBuilder.prototype.createPreliminaryPath
 * @return {Module.Path} preliminary points
 */
// Module.PathBuilder.prototype.createPreliminaryPath();

/**
 * Gets the preliminary path for the path ending
 *
 * @method Module.PathBuilder.prototype.finishPreliminaryPath
 * @return {Module.Path} completed preliminary points
 */
// Module.PathBuilder.prototype.finishPreliminaryPath(pathEnding);

/**
 * Returns the control point of the path at the index specified.
 * Point is structure with x, y, width and alpha properties.
 * If the path is missing fields (for example has only x and y), the missing fields will be set to NaN.
 *
 * @method Module.PathBuilder.prototype.pointAtIndex
 * @param {int} index in path
 * @return {Module.Point2D} point at index
 */
// Module.PathBuilder.prototype.pointAtIndex(index);

/**
 * Returns the count of the control points
 *
 * @method Module.PathBuilder.prototype.pointsCount
 * @return {int} points count
 */
// Module.PathBuilder.prototype.pointsCount();

/**
 * Creates path from points
 *
 * @method Module.PathBuilder.prototype.createPath
 * @param {(Module.Int64Ptr | Float32Array | Array)} points
 * @return {Module.Path} path
 */
// Module.PathBuilder.prototype.createPath(points);

// •••••••••••••• Module.SpeedPathBuilder ••••••••••••••
/**
 * PathBuilder implememtation
 *
 * @class Module.SpeedPathBuilder
 * @extends Module.PathBuilder
 * @since version 1.0
 */
// Module.SpeedPathBuilder();

/**
 * The method calculates a path part (a set of control points) from the provided input.
 * The returned path part can be modified by clients (for example it can be smoothed).
 * After that the part should be added it to the currently built path with the 'addPathPart' method.
 *
 * @method Module.SpeedPathBuilder.prototype.addPoint
 * @param {Module.InputPhase} phase InputPhase, value from InputPhase enum
 * @param {Module.Point} point
 * @param {double} timestamp The timestamp of the input event
 * @return {Module.Path} added points
 */
// Module.SpeedPathBuilder.prototype.addPoint(phase, point, timestamp);

// •••••••••••••• Module.PressurePathBuilder ••••••••••••••
/**
 * PathBuilder implememtation
 *
 * @class Module.PressurePathBuilder
 * @extends Module.PathBuilder
 * @since version 1.0
 */
// Module.PressurePathBuilder();

/**
 * The method calculates a path part (a set of control points) from the provided input.
 * The returned path part can be modified by clients (for example it can be smoothed).
 * After that the part should be added it to the currently built path with the 'addPathPart' method.
 *
 * @method Module.PressurePathBuilder.prototype.addPoint
 * @param {Module.InputPhase} phase InputPhase, value from InputPhase enum
 * @param {Module.Point} point
 * @param {float} pressure The value of the pressure sensor
 * @return {Module.Path} added points
 */
// Module.PressurePathBuilder.prototype.addPoint(phase, point, pressure);

// •••••••••••••• Module.MultiChannelSmoothener ••••••••••••••
/**
 * This class is used the smooth out the noise in a data sequence.
 * The implementation is based on the double exponential smoothing technique.
 * The result of the smooth operation will depend only on the last several values of the sequence.
 * The smoothener works best for touch input with rate of 60 events per second.
 *
 * @class Module.MultiChannelSmoothener
 * @since version 1.2
 * @param {int} channelCount indicates how many independent data sequences we will smooth
 */
// Module.MultiChannelSmoothener(channelCount);

/**
 * The count of the independent data sequences smoothed
 *
 * @memberof Module.MultiChannelSmoothener.prototype
 * @member {int} channelsCount
 */
// Module.MultiChannelSmoothener.prototype.channelsCount;

/**
 * Enables channel with the specified index to be smoothed.
 * By default all channels are enabled.
 *
 * @method Module.MultiChannelSmoothener.prototype.enableChannel
 * @param {int} idx channel index
 */
// Module.MultiChannelSmoothener.prototype.enableChannel(idx);

/**
 * Disable channel with the specified index for smoothing.
 * The values for this channel will returned unchanged.
 * By default all channels are enabled.
 *
 * @method Module.MultiChannelSmoothener.prototype.disableChannel
 * @param {int} idx channel index
 */
// Module.MultiChannelSmoothener.prototype.disableChannel(idx);

/**
 * Check channel is enabled
 *
 * @method Module.MultiChannelSmoothener.prototype.enabled
 * @param {int} idx channel index
 */
// Module.MultiChannelSmoothener.prototype.enabled(idx);

/**
 * Smooths the next values in the data sequences.
 * The size of the values parameter must be a multiple of the channelsCount property.
 *
 * @method Module.MultiChannelSmoothener.prototype.smooth
 * @param {Module.Path} path raw points
 * @param {boolean} finish when true smoothing finish with path
 * @return {Module.Path} smoothed points
 */
// Module.MultiChannelSmoothener.prototype.smooth(path, finish);

/**
 * Resets the smoothers so it is ready for a new data sequence
 *
 * @method Module.MultiChannelSmoothener.prototype.reset
 */
// Module.MultiChannelSmoothener.prototype.reset();

// •••••••••••••• Module.Intersector ••••••••••••••
/**
 * Calculates the intersection between a stroke and a target.
 * A target could be another stroke, or the area enclosed by a path. On intersection the class will return a list of intervals.
 * They will start from the beginning of the stroke and finish at the end of it. Every interval will be either entirely inside the target or entirely outside of it.
 * The class could be also used to make a fast check if the stroke and target are intersecting at all, without calculating intervals.
 *
 * @class Module.Intersector
 * @since version 1.2
 */
// Module.Intersector();

/**
 * Sets the target of intersection to be a stoke. Once set, the target could be intersect with many other strokes efficiently.
 *
 * @method Module.Intersector.prototype.setTargetAsStroke
 * @param {Module.Path} path control points of the trace
 * @param {float} width The width of the trace. If the trace has variable width, which is present in the points vector, this parameter must be NaN.
 */
// Module.Intersector.prototype.setTargetAsStroke(path, width);

/**
 * Sets the target of intersection to be the area enclosed by a path. Once set, the target could be intersect with many strokes efficiently.
 *
 * @method Module.Intersector.prototype.setTargetAsClosedPath
 * @param {Module.Path} path control points of the trace
 */
// Module.Intersector.prototype.setTargetAsClosedPath(path);

/**
 * Checks if the target set intersects the stroke passed
 *
 * @method Module.Intersector.prototype.isIntersectingTarget
 * @param {Module.Stroke} stroke data to check is intersection available
 * @return {boolean}
 */
// Module.Intersector.prototype.isIntersectingTarget(stroke);

/**
 * Calculates intersection intervals of the stroke passed with the target set.
 * Returns a list of intervals. The intervals will cover the whole stroke.
 * They will start from the beginning of the stroke and finish at the end of it.
 * Every interval will be either entirely inside the target or entirely outside of it.
 *
 * @method Module.Intersector.prototype.intersectWithTarget
 * @param {Module.Stroke} stroke data to intersect with target
 * @return {Module.VectorInterval}
 */
// Module.Intersector.prototype.intersectWithTarget(stroke);

// •••••••••••••• Module.InkEncoder ••••••••••••••
/**
 * Encodes data for export
 *
 * @class Module.InkEncoder
 * @since version 1.1
 */
// Module.InkEncoder();

/**
 * Encodes strokes array.
 *
 * @method Module.InkEncoder.encode
 * @param {Array<Module.Stroke>} strokes data to encode
 * @return {Uint8Array} bytes encoded data
 */
// Module.InkEncoder.encode(strokes);

/**
 * Adds message part. Stroke path encode precision is defaulted to 2.
 * To define different encode precision set stroke property 'encodePrecision' to this value.
 * To refer brush when Module.ParticleBrush used should set property 'id' to index.
 * This is index of array which contains all serialized brushes.
 *
 * @method Module.InkEncoder.prototype.encode
 * @param {Module.Stroke} stroke data to encode
 */
// Module.InkEncoder.prototype.encode(stroke);

/**
 * Retruns pointer to HEAP, bytes from reading of path
 *
 * @method Module.InkEncoder.prototype.getBytes
 * @return {Module.Int64Ptr} pointer to exported data
 */
// Module.InkEncoder.prototype.getBytes();

// •••••••••••••• Module.InkDecoder ••••••••••••••
/**
 * Decode data from import
 *
 * @class Module.InkDecoder
 * @since version 1.1
 * @param {Module.Int64Ptr} data
 */
// Module.InkDecoder(data);

/**
 * Decodes serialized data to array of strokes.
 * To use this method should implement Module.InkDecoder.getBrush method.
 *
 * @method Module.InkDecoder.decode
 * @param {Uint8Array} bytes serialized strokes
 * @param {Module.StrokeBrush} brush stroke brush
 * @return {Array<Module.Stroke>} strokes array with 'bounds' property which is all strokes bounds
 */
// Module.InkDecoder.decode(bytes);

/**
 * Ink decoding needs implememtation of this method
 *
 * @method Module.InkDecoder.getStrokeBrush
 * @abstract
 * @param {int} paint brush reference, it could be array index or id from custom scheme
 * @param {Object} [user] brush owner
 * @return {Module.StrokeBrush} brush for stroke rendering
 */
// Module.InkDecoder.getStrokeBrush(paint, [user]);

/**
 * Used to chech is all messeage is read
 *
 * @method Module.InkDecoder.prototype.hasNext
 * @return {boolean} is message EOF reached
 */
// Module.InkDecoder.prototype.hasNext();

/**
 * Decodes message part
 *
 * @method Module.InkDecoder.prototype.decode
 * @param {Module.StrokeBrush} [brush] stroke brush
 * @return {Module.Stroke} decoded stroke
 */
// Module.InkDecoder.prototype.decode(brush);

// •••••••••••••• Module.BrushEncoder ••••••••••••••
/**
 * Encodes data for export
 *
 * @class Module.BrushEncoder
 * @since version 1.3
 */
// Module.BrushEncoder();

/**
 * Adds message part
 *
 * @method Module.BrushEncoder.prototype.encode
 * @param {Module.ParticleBrush} brush
 */
// Module.BrushEncoder.prototype.encode(brush);

/**
 * Retruns pointer to HEAP, bytes from reading of brush
 *
 * @method Module.BrushEncoder.prototype.getBytes
 * @return {Module.Int64Ptr} pointer to exported data
 */
// Module.BrushEncoder.prototype.getBytes();

// •••••••••••••• Module.BrushDecoder ••••••••••••••
/**
 * Decode data from import
 *
 * @class Module.BrushDecoder
 * @since version 1.3
 * @param {Module.Int64Ptr} data
 */
// Module.BrushDecoder(data);

/**
 * Decodes message. When ready calls onComplete method.
 *
 * @method Module.BrushDecoder.prototype.decode
 */
// Module.BrushDecoder.prototype.decode();

/**
 * Should be overrided. When decode completes brushes will be returned as a parameter.
 *
 * @method Module.BrushDecoder.prototype.onComplete
 * @param {Array<Module.ParticleBrush>} brushes decoded brushes
 */
// Module.BrushDecoder.prototype.onComplete(brushes);

// •••••••••••••• Module.PathOperationEncoder ••••••••••••••
/**
 * Prepare operations for sending. Can batch more than one operation.
 *
 * @class Module.PathOperationEncoder
 * @since version 1.4
 */
// Module.PathOperationEncoder();

/**
 * Compose operation style handler
 *
 * @method Module.PathOperationEncoder.prototype.encodeComposeStyle
 * @param {(Module.ComposeStyle | Module.StrokeRenderer)} style describes how the stroke should be rendered
 */
// Module.PathOperationEncoder.prototype.encodeComposeStyle(style);

/**
 * Compose operation path points handler
 *
 * @method Module.PathOperationEncoder.prototype.encodeComposePathPart
 * @param {Module.Path} path composed path part
 * @param {Module.Color} color composition color
 * @param {boolean} variableWidth is path contains width data
 * @param {boolean} variableColor is path contains color data
 * @param {boolean} endStroke is sroke completed
 */
// Module.PathOperationEncoder.prototype.encodeComposePathPart(path, color, variableWidth, variableColor, endStroke);

/**
 * Compose operation abort handler
 *
 * @method Module.PathOperationEncoder.prototype.encodeComposeAbort
 */
// Module.PathOperationEncoder.prototype.encodeComposeAbort();

/**
 * Add stroke operation handler
 *
 * @method Module.PathOperationEncoder.prototype.encodeAdd
 * @param {Array<Module.Stroke>} strokes array from strokes that should be added
 */
// Module.PathOperationEncoder.prototype.encodeAdd(strokes);

/**
 * Remove stroke operation handler
 *
 * @method Module.PathOperationEncoder.prototype.encodeRemove
 * @param {Uint32Array} group list of stroke identifiers
 */
// Module.PathOperationEncoder.prototype.encodeRemove(group);

/**
 * Update stroke color operation handler
 *
 * @method Module.PathOperationEncoder.prototype.encodeUpdateColor
 * @param {Uint32Array} group list of stroke identifiers
 * @param {Module.Color} color update color
 */
// Module.PathOperationEncoder.prototype.encodeUpdateColor(group, color);

/**
 * Update stroke blend mode operation handler
 *
 * @method Module.PathOperationEncoder.prototype.encodeUpdateBlendMode
 * @param {Uint32Array} group list of stroke identifiers
 * @param {Module.BlendMode} blendMode update blendMode
 */
// Module.PathOperationEncoder.prototype.encodeUpdateBlendMode(group, blendMode);

/**
 * Split stroke operation handler
 *
 * @method Module.PathOperationEncoder.prototype.encodeSplit
 * @param {Array<Module.Split>} splits array from splits that should be happens
 */
// Module.PathOperationEncoder.prototype.encodeSplit(splits);

/**
 * Transform stroke operation handler
 *
 * @method Module.PathOperationEncoder.prototype.encodeTransform
 * @param {Uint32Array} group list of stroke identifiers
 * @param {Module.Matrix2D} mat transform matrix
 */
// Module.PathOperationEncoder.prototype.encodeTransform(group, mat);

/**
 * Retruns pointer to HEAP, bytes from encoded operations.
 * This call resests encoder state and it is ready to encode new operations.
 *
 * @method Module.PathOperationEncoder.prototype.getBytes
 * @return {Module.Int64Ptr} pointer to exported data
 */
// Module.PathOperationEncoder.prototype.getBytes();

/**
 * Clears encoder state
 *
 * @method Module.PathOperationEncoder.prototype.reset
 */
// Module.PathOperationEncoder.prototype.reset();

// •••••••••••••• Module.PathOperationDecoderCallbacksHandlerInterface ••••••••••••••
/**
 * Module.PathOperationDecoder operations handler
 *
 * @interface Module.PathOperationDecoderCallbacksHandlerInterface
 * @since version 1.4
 */
// Module.PathOperationDecoderCallbacksHandlerInterface;

/**
 * Compose operation style handler
 *
 * @method Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onComposeStyle
 * @param {Object} user sender
 * @param {Module.ComposeStyle} style describes how the stroke should be rendered
 */
// Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onComposeStyle(user, style);

/**
 * Compose operation path points handler
 *
 * @method Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onComposePathPart
 * @param {Object} user sender
 * @param {Module.Path} path composed path part
 * @param {boolean} endStroke is sroke completed
 */
// Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onComposePathPart(user, path, endStroke);

/**
 * Compose operation abort handler
 *
 * @method Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onComposeAbort
 * @param {Object} user sender
 */
// Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onComposeAbort(user);

/**
 * Add stroke operation handler
 *
 * @method Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onAdd
 * @param {Object} user sender
 * @param {Array<Module.Stroke>} strokes array from strokes that should be added
 */
// Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onAdd(user, strokes);

/**
 * Remove stroke operation handler
 *
 * @method Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onRemove
 * @param {Object} user sender
 * @param {Uint32Array} group list of stroke identifiers
 */
// Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onRemove(user, group);

/**
 * Update stroke color operation handler
 *
 * @method Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onUpdateColor
 * @param {Object} user sender
 * @param {Uint32Array} group list of stroke identifiers
 * @param {Module.Color} color update color
 */
// Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onUpdateColor(user, group, color);

/**
 * Update stroke blend mode operation handler
 *
 * @method Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onUpdateBlendMode
 * @param {Object} user sender
 * @param {Uint32Array} group list of stroke identifiers
 * @param {Module.BlendMode} blendMode update blendMode
 */
// Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onUpdateBlendMode(user, group, blendMode);

/**
 * Split stroke operation handler
 *
 * @method Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onSplit
 * @param {Object} user sender
 * @param {Array<Module.Split>} splits array from splits that should be happens
 */
// Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onSplit(user, splits);

/**
 * Transform stroke operation handler
 *
 * @method Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onTransform
 * @param {Object} user sender
 * @param {Uint32Array} group list of stroke identifiers
 * @param {Module.Matrix2D} mat transform matrix
 */
// Module.PathOperationDecoderCallbacksHandlerInterface.prototype.onTransform(user, group, mat);

// •••••••••••••• Module.PathOperationDecoder ••••••••••••••
/**
 * Path operations decoder
 *
 * @class Module.PathOperationDecoder
 * @since version 1.4
 * @param {Module.PathOperationDecoderCallbacksHandlerInterface} handler implementation
 */
// Module.PathOperationDecoder(handler);

/**
 * Applies implementation to result instance
 *
 * @method Module.PathOperationDecoder.getPathOperationDecoderCallbacksHandler
 * @param {Object} implementation PathOperationDecoderCallbacksHandlerInterface implementation
 * @return {Module.PathOperationDecoderCallbacksHandler} operations callback handler
 */
// Module.PathOperationDecoder.getPathOperationDecoderCallbacksHandler(implementation);

/**
 * Decodes data when receive it from network.
 * When operation decoded is launched appropriate event related with it, provided by
 * PathOperationDecoderCallbacksHandlerInterface implementation.
 *
 * @method Module.PathOperationDecoder.prototype.decode
 * @param {Object} user sender
 * @param {Module.Int64Ptr} data
 */
// Module.PathOperationDecoder.prototype.decode(user, data);

// •#•#•#•#•#•#•#•#•#•#•#•#•#• MatTools •#•#•#•#•#•#•#•#•#•#•#•#•#•

/**
 * @namespace Module.MatTools
 * @description helper methods for Matrix2D
 */

/**
 * Creates a matrix
 *
 * @method Module.MatTools.create
 * @param {PlainObject} [values] init values that overrides identity matrix values
 * @return {Module.Matrix2D} matrix
 */
 // Module.MatTools.create(values);

/**
 * Check is the given matrix is identity matrix
 *
 * @method Module.MatTools.isIdentity
 * @param {Module.Matrix2D} mat matrix to check
 * @return {boolean} is the matrix is identity matrix
 */
 // Module.MatTools.isIdentity(mat);

/**
 * Inverts a matrix
 *
 * @method Module.MatTools.invert
 * @param {Module.Matrix2D} mat matrix to invert
 * @return {Module.Matrix2D} inverted matrix
 */
 // Module.MatTools.invert(mat);

/**
 * Multiplyes 2 matrices
 *
 * @method Module.MatTools.multiply
 * @param {Module.Matrix2D} mat1
 * @param {Module.Matrix2D} mat2
 * @return {Module.Matrix2D} result matrix
 */
 // Module.MatTools.multiply(mat1, mat2);

/**
 * Transform the given point with the given matrix
 *
 * @method Module.MatTools.transformPoint
 * @param {Module.Point} pt point to transform
 * @param {Module.Matrix2D} mat transform matrix
 * @return {Module.Point} transformed point
 */
 // Module.MatTools.transformPoint(pt, mat);

 /**
 * Transform the given rectangle with the given matrix
 *
 * @method Module.MatTools.transformRect
 * @param {Module.Rectangle} rect rectangle to transform
 * @param {Module.Matrix2D} mat transform matrix
 * @return {Module.Rectangle} transformed rectangle
 */
 // Module.MatTools.transformRect(rect, mat);