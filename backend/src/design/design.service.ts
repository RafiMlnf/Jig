import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateDesignDto } from './dto/update-design.dto';

@Injectable()
export class DesignService {
  constructor(private prisma: PrismaService) {}

  /** Get all items (alias for inventory list) for the design form dropdown */
  async getAllItems() {
    const designs = await this.prisma.design.findMany({
      include: { line: true, documents: true, revisionHistories: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { noReg: 'asc' },
    });

    return designs.map((d) => ({
      id: d.id,
      noReg: d.noReg,
      assyPartName: d.assyPartName,
      lineProduct: d.line.lineName,
      revStatus: d.revStatus,
      designDateNew: d.designDateNew,
      docLocation2D: d.documents[0]?.loc2D || null,
      docLocation3D: d.revisionHistories[0]?.loc3D || null,
    }));
  }

  /**
   * Update the design revision of a Design.
   * Also automatically creates an Approval record of type DESIGN_REVISION.
   */
  async updateDesignRevision(itemId: string, dto: UpdateDesignDto, userId: string) {
    // Check item exists
    const item = await this.prisma.design.findUnique({
      where: { id: itemId },
      include: { line: true },
    });
    if (!item) throw new NotFoundException(`Item ${itemId} not found`);

    // Update the item design fields (excluding document locations)
    const updated = await this.prisma.design.update({
      where: { id: itemId },
      data: {
        revStatus: dto.revStatus,
        designDateNew: dto.designDateNew ? new Date(dto.designDateNew) : undefined,
      },
    });

    // Handle document creation/update if location is updated
    if (dto.docLocation2D) {
      await this.prisma.document.create({
        data: {
          designId: itemId,
          path2D: dto.docLocation2D,
          loc2D: dto.docLocation2D,
          approvalStatus: 'WAITING',
        },
      });
    }

    // Find approver users based on Role model name
    const sectionHead = await this.prisma.user.findFirst({
      where: { role: { name: 'PE_SECTION_HEAD' } },
    });
    const deptHead = await this.prisma.user.findFirst({
      where: { role: { name: 'PE_DEPT_HEAD' } },
    });

    // Create approval request
    const approval = await this.prisma.approval.create({
      data: {
        type: 'DESIGN_REVISION',
        status: 'WAITING',
        designId: item.id,
        revisionNote: dto.revisionNote || `Revisi desain ${item.noReg} — Rev ${dto.revStatus}`,
        submittedById: userId,
        sectionHeadId: sectionHead?.id,
        deptHeadId: deptHead?.id,
        sectionStatus: 'WAITING',
        deptStatus: 'WAITING',
        finalStatus: 'WAITING',
      },
    });

    // Log revision history
    await this.prisma.revisionHistory.create({
      data: {
        designId: item.id,
        revStatus: dto.revStatus,
        description: dto.revisionNote || `Update Rev ${dto.revStatus}`,
        changedById: userId,
        vendorId: dto.vendorId || undefined,
        poNumber: dto.poNumber || undefined,
        cost: dto.cost ? parseFloat(String(dto.cost)) : 0,
        leadTime: dto.leadTime ? parseInt(String(dto.leadTime)) : undefined,
        loc3D: dto.docLocation3D || undefined,
        path3D: dto.docLocation3D || undefined,
      },
    });

    return { updated, approval };
  }

  /** Get design revision history (approvals) for a specific item */
  async getDesignHistory(itemId: string) {
    return this.prisma.approval.findMany({
      where: { designId: itemId, type: 'DESIGN_REVISION' },
      include: {
        submittedBy: {
          select: {
            name: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get complete master list with all relations for View Data expander */
  async getMasterList() {
    const designs = await this.prisma.design.findMany({
      include: {
        line: true,
        process: true,
        vendor: true,
        documents: true,
        abnormalities: {
          include: { reportedBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        revisionHistories: {
          include: { changedBy: { select: { name: true } }, vendor: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { noReg: 'asc' },
    });

    return designs.map((d) => ({
      id: d.id,
      noReg: d.noReg,
      assyPartName: d.assyPartName,
      qty: d.qty,
      noItem: d.noItem,
      type: d.type,
      lifecycleStatus: d.lifecycleStatus,
      inventoryStatus: d.inventoryStatus,
      abnormalityStatus: d.abnormalityStatus,
      minimumStock: d.minimumStock,
      actualStock: d.actualStock,
      designDateNew: d.designDateNew,
      revStatus: d.revStatus,
      lineProduct: d.line.lineName,
      process: d.process.name,
      vendor: d.vendor ? { id: d.vendor.id, name: d.vendor.name } : null,
      documents: d.documents.map((doc) => ({
        id: doc.id,
        path2D: doc.path2D,
        loc2D: doc.loc2D,
        approvalStatus: doc.approvalStatus,
      })),
      revisionHistories: d.revisionHistories.map((rev) => ({
        id: rev.id,
        revStatus: rev.revStatus,
        description: rev.description,
        poNumber: rev.poNumber,
        cost: rev.cost,
        leadTime: rev.leadTime,
        approvedByName: rev.approvedByName,
        createdAt: rev.createdAt,
        vendorName: rev.vendor?.name || 'N/A',
        changedBy: rev.changedBy.name,
      })),
      abnormalities: d.abnormalities.map((abn) => ({
        id: abn.id,
        type: abn.type,
        description: abn.description,
        status: abn.status,
        dateFound: abn.dateFound,
        foundBy: abn.foundBy,
        rootCause: abn.rootCause,
        tempAction: abn.tempAction,
        correctiveAction: abn.correctiveAction,
        actionPic: abn.actionPic,
        linkToRevision: abn.linkToRevision,
        createdAt: abn.createdAt,
        reportedBy: abn.reportedBy.name,
      })),
    }));
  }

  async getVendors() {
    return this.prisma.vendor.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
