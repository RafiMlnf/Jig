import { Controller, Get, Patch, Param, Body, Request, UseGuards } from '@nestjs/common';
import { DesignService } from './design.service';
import { UpdateDesignDto } from './dto/update-design.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('design')
@UseGuards(JwtAuthGuard)
export class DesignController {
  constructor(private readonly designService: DesignService) {}

  /** List all items for dropdown selection */
  @Get('items')
  getAllItems() {
    return this.designService.getAllItems();
  }

  /** List all vendors for dropdown selection */
  @Get('vendors')
  getVendors() {
    return this.designService.getVendors();
  }

  /** Get complete master list with relations for View Data */
  @Get('master-list')
  getMasterList() {
    return this.designService.getMasterList();
  }

  /** Update design revision for an item — also auto-creates Approval */
  @Patch(':id')
  updateDesign(
    @Param('id') id: string,
    @Body() dto: UpdateDesignDto,
    @Request() req: any,
  ) {
    return this.designService.updateDesignRevision(id, dto, req.user.id);
  }

  /** Get revision history for a specific item */
  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.designService.getDesignHistory(id);
  }
}
