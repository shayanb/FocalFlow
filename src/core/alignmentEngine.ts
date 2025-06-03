import { FocalImage, Transform, Point } from '../types/canvas'

export interface AlignmentResult {
  imageId: string
  transform: Transform
}

export function calculateAlignments(images: FocalImage[]): AlignmentResult[] {
  // Filter images that have focal points
  const imagesWithFocalPoints = images.filter(img => img.focalPoint)
  
  if (imagesWithFocalPoints.length < 2) {
    return []
  }

  // Use the first image with a focal point as reference
  const referenceImage = imagesWithFocalPoints[0]
  const referenceFocalPoint = referenceImage.focalPoint!
  
  // Calculate the reference focal point in world coordinates
  const referenceWorldPoint: Point = {
    x: referenceImage.transform.position.x + 
       (referenceFocalPoint.x - referenceImage.naturalSize.width / 2) * referenceImage.transform.scale,
    y: referenceImage.transform.position.y + 
       (referenceFocalPoint.y - referenceImage.naturalSize.height / 2) * referenceImage.transform.scale
  }

  const alignments: AlignmentResult[] = []

  // Align all other images to the reference
  imagesWithFocalPoints.forEach((image, index) => {
    if (index === 0) {
      // Reference image stays in place
      alignments.push({
        imageId: image.id,
        transform: image.transform
      })
      return
    }

    if (!image.focalPoint) return

    // Calculate where this image needs to be positioned
    // so its focal point aligns with the reference focal point
    const focalOffset = {
      x: (image.focalPoint.x - image.naturalSize.width / 2) * image.transform.scale,
      y: (image.focalPoint.y - image.naturalSize.height / 2) * image.transform.scale
    }

    const newPosition: Point = {
      x: referenceWorldPoint.x - focalOffset.x,
      y: referenceWorldPoint.y - focalOffset.y
    }

    alignments.push({
      imageId: image.id,
      transform: {
        ...image.transform,
        position: newPosition
      }
    })
  })

  return alignments
}

export function autoAlignImages(images: FocalImage[]): FocalImage[] {
  const alignments = calculateAlignments(images)
  
  if (alignments.length === 0) {
    return images
  }

  // Create a map for quick lookup
  const alignmentMap = new Map(alignments.map(a => [a.imageId, a]))

  // Apply alignments to images
  return images.map(image => {
    const alignment = alignmentMap.get(image.id)
    if (alignment) {
      return {
        ...image,
        transform: alignment.transform
      }
    }
    return image
  })
}