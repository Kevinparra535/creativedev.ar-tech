import Foundation
import simd
import ARKit

// MARK: - Alignment Result

/// Result of the wall alignment calculation
public struct AlignmentResult {
    let transformMatrix: simd_float4x4
    let scale: Float
    let rotation: simd_quatf
    let translation: simd_float3
    let confidence: Float  // 0.0 - 1.0

    func toDictionary() -> [String: Any] {
        return [
            "transformMatrix": matrixToArray(transformMatrix),
            "scale": scale,
            "rotation": [rotation.vector.x, rotation.vector.y, rotation.vector.z, rotation.vector.w],
            "translation": [translation.x, translation.y, translation.z],
            "confidence": confidence
        ]
    }

    private func matrixToArray(_ matrix: simd_float4x4) -> [[Float]] {
        return [
            [matrix.columns.0.x, matrix.columns.0.y, matrix.columns.0.z, matrix.columns.0.w],
            [matrix.columns.1.x, matrix.columns.1.y, matrix.columns.1.z, matrix.columns.1.w],
            [matrix.columns.2.x, matrix.columns.2.y, matrix.columns.2.z, matrix.columns.2.w],
            [matrix.columns.3.x, matrix.columns.3.y, matrix.columns.3.z, matrix.columns.3.w]
        ]
    }
}

// MARK: - Wall Alignment Engine

/// Engine for calculating the 3D transformation (scale, rotation, translation)
/// that aligns a virtual wall with a real wall in AR space
public class WallAlignmentEngine {

    /// Main function to calculate alignment between virtual and real walls
    /// - Parameters:
    ///   - virtualWall: The wall selected from the 3D model
    ///   - realWall: The wall detected in the AR session
    /// - Returns: AlignmentResult containing transformation and confidence
    public static func calculateAlignment(
        virtualWall: WallSelectionData,
        realWall: RealWallData
    ) -> AlignmentResult {
        print("🔧 Starting alignment calculation...")
        print("   Virtual wall: \(virtualWall.width)m x \(virtualWall.height)m")
        print("   Real wall: \(realWall.width)m x \(realWall.height)m")

        // Step 1: Calculate scale
        let scale = calculateScale(virtual: virtualWall, real: realWall)
        print("   ✓ Scale calculated: \(scale)")

        // Step 2: Calculate rotation (align normals)
        let rotation = calculateRotation(
            virtualNormal: virtualWall.normal,
            realNormal: realWall.normal
        )
        print("   ✓ Rotation calculated")

        // Step 3: Calculate translation
        let translation = calculateTranslation(
            virtualCenter: virtualWall.center,
            realCenter: realWall.center,
            scale: scale,
            rotation: rotation
        )
        print("   ✓ Translation calculated: [\(translation.x), \(translation.y), \(translation.z)]")

        // Step 4: Compose transformation matrix
        let transform = composeTransform(
            scale: scale,
            rotation: rotation,
            translation: translation
        )
        print("   ✓ Transform matrix composed")

        // Step 5: Calculate confidence
        let confidence = calculateConfidence(
            virtual: virtualWall,
            real: realWall,
            scale: scale
        )
        print("   ✓ Confidence: \(Int(confidence * 100))%")

        return AlignmentResult(
            transformMatrix: transform,
            scale: scale,
            rotation: rotation,
            translation: translation,
            confidence: confidence
        )
    }

    // MARK: - Step 1: Scale Calculation

    /// Calculate uniform scale factor based on wall dimensions
    /// Uses weighted average favoring the larger dimension for better precision
    private static func calculateScale(
        virtual: WallSelectionData,
        real: RealWallData
    ) -> Float {
        let scaleWidth = real.width / virtual.width
        let scaleHeight = real.height / virtual.height

        // Weighted average (favor larger dimension for better precision)
        let weightWidth = virtual.width / (virtual.width + virtual.height)
        let weightHeight = virtual.height / (virtual.width + virtual.height)

        let scale = scaleWidth * weightWidth + scaleHeight * weightHeight

        print("      Scale breakdown: width=\(scaleWidth), height=\(scaleHeight), final=\(scale)")
        return scale
    }

    // MARK: - Step 2: Rotation Calculation

    /// Calculate rotation quaternion to align virtual wall normal with real wall normal
    /// Uses vector algebra to find rotation axis and angle
    private static func calculateRotation(
        virtualNormal: simd_float3,
        realNormal: simd_float3
    ) -> simd_quatf {
        // Spec v0.2 (interiors): align yaw only around world up to avoid roll/pitch.
        // Project normals onto horizontal plane (y = 0).
        let vRaw = normalize(virtualNormal)
        let rRaw = normalize(realNormal)

        let v = simd_float3(vRaw.x, 0, vRaw.z)
        let r = simd_float3(rRaw.x, 0, rRaw.z)

        let vLen = length(v)
        let rLen = length(r)
        if vLen < 0.0001 || rLen < 0.0001 {
            print("      Warning: normal projection too small - no yaw rotation")
            return simd_quatf(angle: 0, axis: [0, 1, 0])
        }

        let vN = v / vLen
        let rN = r / rLen

        // Signed yaw angle around +Y (world up)
        let crossY = cross(vN, rN).y
        let dotVR = dot(vN, rN)
        let angle = atan2(crossY, dotVR)

        print("      Yaw rotation angle: \(angle * 180 / .pi)°")
        return simd_quatf(angle: angle, axis: [0, 1, 0])
    }

    // MARK: - Step 3: Translation Calculation

    /// Calculate translation to align wall centers after scaling and rotation
    private static func calculateTranslation(
        virtualCenter: simd_float3,
        realCenter: simd_float3,
        scale: Float,
        rotation: simd_quatf
    ) -> simd_float3 {
        // Transform virtual center with scale and rotation
        let scaledVirtualCenter = virtualCenter * scale
        let rotatedVirtualCenter = rotation.act(scaledVirtualCenter)

        // Calculate offset needed to align centers
        let translation = realCenter - rotatedVirtualCenter

        return translation
    }

    // MARK: - Step 4: Transform Composition

    /// Compose final transformation matrix from scale, rotation, and translation
    /// CRITICAL: Order must be Translation × Rotation × Scale
    private static func composeTransform(
        scale: Float,
        rotation: simd_quatf,
        translation: simd_float3
    ) -> simd_float4x4 {
        // Create individual transformation matrices
        let scaleMatrix = simd_float4x4(diagonal: [scale, scale, scale, 1.0])
        let rotationMatrix = simd_float4x4(rotation)
        let translationMatrix = simd_float4x4(
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [translation.x, translation.y, translation.z, 1]
        )

        // Compose: Translation × Rotation × Scale
        return translationMatrix * rotationMatrix * scaleMatrix
    }

    // MARK: - Step 5: Confidence Calculation

    /// Calculate confidence score (0.0 - 1.0) for the alignment
    /// Based on:
    /// - 40% Aspect ratio similarity
    /// - 30% Scale reasonableness
    /// - 30% Dimensional match after scaling
    private static func calculateConfidence(
        virtual: WallSelectionData,
        real: RealWallData,
        scale: Float
    ) -> Float {
        // Factor 1: Aspect ratio similarity (40%)
        let virtualAspect = virtual.width / virtual.height
        let realAspect = real.width / real.height
        let aspectSimilarity = 1.0 - min(
            abs(virtualAspect - realAspect) / realAspect,
            1.0
        )

        // Factor 2: Scale reasonableness (30%)
        // Expect scale between 0.5x and 2.0x
        let scaleReasonableness: Float
        if scale >= 0.5 && scale <= 2.0 {
            scaleReasonableness = 1.0
        } else if scale < 0.5 {
            scaleReasonableness = max(0.0, scale / 0.5)
        } else {
            scaleReasonableness = max(0.0, 2.0 / scale)
        }

        // Factor 3: Dimensional match after scaling (30%)
        let scaledVirtualWidth = virtual.width * scale
        let scaledVirtualHeight = virtual.height * scale
        let widthMatch = 1.0 - min(
            abs(scaledVirtualWidth - real.width) / real.width,
            1.0
        )
        let heightMatch = 1.0 - min(
            abs(scaledVirtualHeight - real.height) / real.height,
            1.0
        )
        let dimensionMatch = (widthMatch + heightMatch) / 2.0

        // Weighted average
        let confidence = aspectSimilarity * 0.4 +
                         scaleReasonableness * 0.3 +
                         dimensionMatch * 0.3

        print("      Confidence breakdown:")
        print("        Aspect similarity: \(Int(aspectSimilarity * 100))%")
        print("        Scale reasonableness: \(Int(scaleReasonableness * 100))%")
        print("        Dimension match: \(Int(dimensionMatch * 100))%")

        return confidence
    }
}

// MARK: - Helper Extensions

extension simd_quatf {
    /// Apply quaternion rotation to a vector
    func act(_ v: simd_float3) -> simd_float3 {
        let qv = simd_float3(vector.x, vector.y, vector.z)
        let uv = cross(qv, v)
        let uuv = cross(qv, uv)
        return v + ((uv * vector.w) + uuv) * 2
    }
}

extension simd_float4x4 {
    /// Create a 4x4 matrix from a quaternion
    init(_ q: simd_quatf) {
        let x = q.vector.x
        let y = q.vector.y
        let z = q.vector.z
        let w = q.vector.w

        self.init(
            simd_float4(1 - 2*y*y - 2*z*z, 2*x*y + 2*w*z, 2*x*z - 2*w*y, 0),
            simd_float4(2*x*y - 2*w*z, 1 - 2*x*x - 2*z*z, 2*y*z + 2*w*x, 0),
            simd_float4(2*x*z + 2*w*y, 2*y*z - 2*w*x, 1 - 2*x*x - 2*y*y, 0),
            simd_float4(0, 0, 0, 1)
        )
    }

    /// Create a diagonal matrix
    init(diagonal: simd_float4) {
        self.init(
            simd_float4(diagonal.x, 0, 0, 0),
            simd_float4(0, diagonal.y, 0, 0),
            simd_float4(0, 0, diagonal.z, 0),
            simd_float4(0, 0, 0, diagonal.w)
        )
    }
}
