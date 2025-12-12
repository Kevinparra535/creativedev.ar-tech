import ARKit
import SceneKit

// Convenience class for visualizing plane extent and geometry
// Based on Apple's official TrackingAndVisualizingPlanes sample
class Plane: SCNNode {

    let meshNode: SCNNode
    let extentNode: SCNNode
    var classificationNode: SCNNode?

    // Store the plane anchor reference for React Native events
    let planeAnchor: ARPlaneAnchor

    init(anchor: ARPlaneAnchor, in sceneView: ARSCNView) {
        self.planeAnchor = anchor

        // Create a mesh to visualize the estimated shape of the plane.
        guard let meshGeometry = ARSCNPlaneGeometry(device: sceneView.device!)
            else { fatalError("Can't create plane geometry") }
        meshGeometry.update(from: anchor.geometry)
        meshNode = SCNNode(geometry: meshGeometry)

        // Create a node to visualize the plane's bounding rectangle.
        let extent = Plane.getPlaneExtent(from: anchor)
        let extentPlane: SCNPlane = SCNPlane(
            width: CGFloat(extent.x),
            height: CGFloat(extent.z)
        )
        extentNode = SCNNode(geometry: extentPlane)
        extentNode.simdPosition = anchor.center

        // `SCNPlane` is vertically oriented in its local coordinate space, so
        // rotate it to match the orientation of `ARPlaneAnchor`.
        extentNode.eulerAngles.x = -.pi / 2

        super.init()

        self.setupMeshVisualStyle()
        self.setupExtentVisualStyle()

        // Add the plane extent and plane geometry as child nodes so they appear in the scene.
        addChildNode(meshNode)
        addChildNode(extentNode)

        // Display the plane's classification, if supported on the device
        if #available(iOS 12.0, *), ARPlaneAnchor.isClassificationSupported {
            let classification = classificationString(for: anchor.classification)
            let textNode = self.makeTextNode(classification)
            classificationNode = textNode
            // Change the pivot of the text node to its center
            textNode.centerAlign()
            // Add the classification node as a child node so that it displays the classification
            extentNode.addChildNode(textNode)
        }
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // Update the plane visualization based on the updated anchor
    func update(anchor: ARPlaneAnchor) {
        // Update ARSCNPlaneGeometry to the anchor's new estimated shape.
        if let planeGeometry = meshNode.geometry as? ARSCNPlaneGeometry {
            planeGeometry.update(from: anchor.geometry)
        }

        // Update extent visualization to the anchor's new bounding rectangle.
        if let extentGeometry = extentNode.geometry as? SCNPlane {
            let extent = Plane.getPlaneExtent(from: anchor)
            extentGeometry.width = CGFloat(extent.x)
            extentGeometry.height = CGFloat(extent.z)
            extentNode.simdPosition = anchor.center
        }

        // Update the plane's classification and the text position
        if #available(iOS 12.0, *),
            let classificationNode = classificationNode,
            let classificationGeometry = classificationNode.geometry as? SCNText {
            let currentClassification = classificationString(for: anchor.classification)
            if let oldClassification = classificationGeometry.string as? String,
                oldClassification != currentClassification {
                classificationGeometry.string = currentClassification
                classificationNode.centerAlign()
            }
        }
    }

    private func setupMeshVisualStyle() {
        // Make the plane visualization very subtle (reduced from 0.25)
        meshNode.opacity = 1

        // Use color and blend mode to make planes stand out.
        guard let material = meshNode.geometry?.firstMaterial
            else { fatalError("ARSCNPlaneGeometry always has one material") }

        // Set color based on plane classification for better visual feedback
        material.diffuse.contents = getColorForClassification()
    }

    // Get color based on plane classification
    private func getColorForClassification() -> UIColor {
        if #available(iOS 12.0, *) {
            switch planeAnchor.classification {
            case .floor:
                // Subtle blue for floors (reduced alpha from 0.4 to 0.2)
                return UIColor(red: 0.0, green: 0.5, blue: 1.0, alpha: 0.5)
            case .wall:
                // Subtle orange for walls
                return UIColor(red: 1.0, green: 0.5, blue: 0.0, alpha: 0.5)
            case .ceiling:
                // Subtle purple for ceilings
                return UIColor(red: 0.7, green: 0.3, blue: 1.0, alpha: 0.2)
            case .table:
                // Subtle green for tables
                return UIColor(red: 0.0, green: 0.8, blue: 0.3, alpha: 0.5)
            case .seat:
                // Subtle yellow for seats
                return UIColor(red: 1.0, green: 0.8, blue: 0.0, alpha: 0.5)
            case .window:
                // Subtle cyan for windows
                return UIColor(red: 0.0, green: 0.8, blue: 0.8, alpha: 0.5)
            case .door:
                // Subtle magenta for doors
                return UIColor(red: 1.0, green: 0.0, blue: 0.5, alpha: 0.5)
            default:
                // Subtle gray for unknown/none
                return planeAnchor.alignment == .horizontal ?
                    UIColor(red: 0.0, green: 0.5, blue: 1.0, alpha: 0.5) :
                    UIColor(red: 1.0, green: 0.5, blue: 0.0, alpha: 0.5)
            }
        } else {
            // Fallback for iOS < 12: use subtle alignment-based colors
            return planeAnchor.alignment == .horizontal ?
                UIColor(red: 0.0, green: 0.5, blue: 1.0, alpha: 0.5) :
                UIColor(red: 1.0, green: 0.5, blue: 0.0, alpha: 0.5)
        }
    }

    private func setupExtentVisualStyle() {
        // Make the extent visualization semitransparent to clearly show real-world placement.
        extentNode.opacity = 0.6

        guard let material = extentNode.geometry?.firstMaterial
            else { fatalError("SCNPlane always has one material") }

        // Use same color as mesh for consistency
        material.diffuse.contents = getColorForClassification()

        // Use a simple wireframe rendering
        material.fillMode = .lines
    }

    private func makeTextNode(_ text: String) -> SCNNode {
        let textGeometry = SCNText(string: text, extrusionDepth: 1)
        textGeometry.font = UIFont(name: "Futura", size: 75)
        textGeometry.firstMaterial?.diffuse.contents = UIColor.black

        let textNode = SCNNode(geometry: textGeometry)
        // scale down the size of the text
        textNode.simdScale = SIMD3<Float>(repeating: 0.0005)

        return textNode
    }

    // Helper function to convert ARPlaneAnchor.Classification to String
    @available(iOS 12.0, *)
    private func classificationString(for classification: ARPlaneAnchor.Classification) -> String {
        switch classification {
        case .none:
            return "None"
        case .wall:
            return "Wall"
        case .floor:
            return "Floor"
        case .ceiling:
            return "Ceiling"
        case .table:
            return "Table"
        case .seat:
            return "Seat"
        case .window:
            return "Window"
        case .door:
            return "Door"
        @unknown default:
            return "Unknown"
        }
    }

    // Helper function to get plane extent (compatible with iOS 16+)
    private static func getPlaneExtent(from anchor: ARPlaneAnchor) -> simd_float3 {
        if #available(iOS 16.0, *) {
            return simd_float3(anchor.planeExtent.width, 0, anchor.planeExtent.height)
        } else {
            return anchor.extent
        }
    }
}

// Extension to center align text nodes
extension SCNNode {
    func centerAlign() {
        let (min, max) = boundingBox
        let extents = SIMD3<Float>(max) - SIMD3<Float>(min)
        simdPivot = float4x4(translation: SIMD3<Float>(extents.x / 2, 0, extents.z / 2))
    }
}

// Extension for translation matrix
extension float4x4 {
    init(translation vector: SIMD3<Float>) {
        self.init(SIMD4<Float>(1, 0, 0, 0),
                  SIMD4<Float>(0, 1, 0, 0),
                  SIMD4<Float>(0, 0, 1, 0),
                  SIMD4<Float>(vector.x, vector.y, vector.z, 1))
    }
}
