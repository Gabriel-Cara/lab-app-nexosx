import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, MailCheck, Package, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Event, Package as PackageType, VisitorLog } from "../types";
import { Badge } from "../components/ui/badge";

export const DashboardPage = () => {
  const { user } = useAuth();
  const { data: packages } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => (await api.get<PackageType[]>("/packages")).data,
  });

  const { data: visitors } = useQuery({
    queryKey: ["visitors"],
    queryFn: async () => (await api.get<VisitorLog[]>("/visitors")).data,
    enabled: user?.role !== "MORADOR",
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => (await api.get<Event[]>("/events")).data,
  });

  const lastDeliveries = packages?.slice(0, 5) ?? [];
  const upcomingEvents = events
    ?.filter((event) => new Date(event.endDate) >= new Date())
    .slice(0, 5);
  const recentVisitors = visitors?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Visão geral</h2>
        <p className="text-sm text-muted-foreground">Monitoramento em tempo real da operação da portaria.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encomendas recebidas</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages?.length ?? "--"}</div>
            <p className="text-xs text-muted-foreground">Total registrado nos últimos 30 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos ativos</CardTitle>
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events?.length ?? "--"}</div>
            <p className="text-xs text-muted-foreground">Próximas reservas e atividades comunitárias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes ativos</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitors?.filter((visitor) => !visitor.exitTime).length ?? (user?.role === "MORADOR" ? "--" : "0")}
            </div>
            <p className="text-xs text-muted-foreground">Visitantes dentro do condomínio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encomendas pendentes</CardTitle>
            <MailCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages?.filter((pkg) => !pkg.retrievedAt).length ?? "--"}</div>
            <p className="text-xs text-muted-foreground">Aguardando retirada pelos moradores</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas encomendas</CardTitle>
            <CardDescription>Códigos de retirada e status das entregas mais recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Morador</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastDeliveries.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{pkg.resident.name}</span>
                        <span className="text-xs text-muted-foreground">{pkg.resident.apartment ?? "--"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{pkg.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{pkg.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.retrievedAt ? "secondary" : "default"}>
                        {pkg.retrievedAt ? "Retirada" : "Pendente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {lastDeliveries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhuma encomenda registrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximos eventos</CardTitle>
            <CardDescription>Reservas de espaços compartilhados nos próximos dias.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents?.map((event) => (
              <div key={event.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                  <Badge variant="outline">
                    {event.bookings.length}/{event.capacity} vagas
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {format(new Date(event.startDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            ))}
            {(!upcomingEvents || upcomingEvents.length === 0) && (
              <p className="text-sm text-muted-foreground">Nenhum evento agendado.</p>
            )}
          </CardContent>
        </Card>
      </div>
      {user?.role !== "MORADOR" && (
        <Card>
          <CardHeader>
            <CardTitle>Visitantes recentes</CardTitle>
            <CardDescription>Controle de entradas e saídas registradas pela portaria.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Morador anfitrião</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Saída</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVisitors.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.visitor.name}</TableCell>
                    <TableCell>{log.visitor.document}</TableCell>
                    <TableCell>{log.host.name}</TableCell>
                    <TableCell>
                      {format(new Date(log.entryTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {log.exitTime ? format(new Date(log.exitTime), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "--"}
                    </TableCell>
                  </TableRow>
                ))}
                {recentVisitors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum visitante registrado recentemente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
